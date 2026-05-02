"""
Model Service
- Loads the .h5 Keras model on startup
- Runs inference on fundus images
- Generates Grad-CAM heatmap for explainability
"""
import io
import base64
import numpy as np
from PIL import Image
import cv2
import tensorflow as tf
from config import settings

_model = None
_last_conv_layer_name = None


def load_model():
    global _model, _last_conv_layer_name
    print(f"Loading model from {settings.model_path}...")
    _model = tf.keras.models.load_model(settings.model_path)
    _model.summary()
    # Build model by calling it once
    dummy = np.zeros((1, settings.img_size, settings.img_size, 3), dtype=np.float32)
    _model(dummy)
    # Find last conv layer
    for layer in reversed(_model.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            _last_conv_layer_name = layer.name
            break
    print(f"✅ Model loaded. Last conv layer: {_last_conv_layer_name}")


def _preprocess(image_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((settings.img_size, settings.img_size))
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)


def predict(image_bytes: bytes) -> dict:
    if _model is None:
        raise RuntimeError("Model not loaded.")

    img_array = _preprocess(image_bytes)

    preds = _model.predict(img_array)

    if preds.shape[-1] == 1:
        prob_positive = float(preds[0][0])
    else:
        prob_positive = float(preds[0][1])

    label = "GON+" if prob_positive >= 0.5 else "GON-"
    confidence = prob_positive if label == "GON+" else 1.0 - prob_positive

    gradcam_b64 = _generate_gradcam(img_array, image_bytes, label)

    return {
        "label": label,
        "confidence": round(confidence, 4),
        "gradcam_b64": gradcam_b64,
    }


def _generate_gradcam(img_array: np.ndarray, original_bytes: bytes, label: str) -> str:
    if _last_conv_layer_name is None:
        return None

    try:
        # Get the conv layer
        conv_layer = _model.get_layer(_last_conv_layer_name)

        # Build a model that outputs conv layer output + final predictions
        # Works for both Sequential and Functional models
        inputs = _model.input
        conv_outputs = conv_layer.output

        # Build sub-model up to conv layer
        conv_model = tf.keras.Model(inputs=inputs, outputs=conv_outputs)

        # Get layers after conv layer
        # We'll use GradientTape on the full model instead
        img_tensor = tf.cast(img_array, tf.float32)

        with tf.GradientTape() as tape:
            # Watch the input
            tape.watch(img_tensor)

            # Get conv output by running conv_model
            conv_out = conv_model(img_tensor)
            tape.watch(conv_out)

            # Now run the rest of the model manually
            # Get index of conv layer
            conv_idx = [i for i, l in enumerate(_model.layers)
                        if l.name == _last_conv_layer_name][0]

            # Run layers after conv
            x = conv_out
            for layer in _model.layers[conv_idx + 1:]:
                x = layer(x)

            predictions = x
            if predictions.shape[-1] == 1:
                class_channel = predictions[:, 0]
            else:
                class_idx = 1 if label == "GON+" else 0
                class_channel = predictions[:, class_idx]

        grads = tape.gradient(class_channel, conv_out)

        if grads is None:
            return _simple_gradcam(img_array, original_bytes, label)

        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
        conv_out_val = conv_out[0]
        heatmap = conv_out_val @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap)
        heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-8)
        heatmap = heatmap.numpy()

        return _overlay_heatmap(heatmap, original_bytes)

    except Exception as e:
        print(f"Grad-CAM failed: {e}, using simple fallback")
        return _simple_gradcam(img_array, original_bytes, label)


def _simple_gradcam(img_array: np.ndarray, original_bytes: bytes, label: str) -> str:
    """Fallback: use raw conv activations as heatmap (no gradients needed)."""
    try:
        conv_layer = _model.get_layer(_last_conv_layer_name)
        conv_model = tf.keras.Model(inputs=_model.input, outputs=conv_layer.output)
        conv_out = conv_model(img_array)[0].numpy()  # shape: (H, W, filters)
        heatmap = np.mean(conv_out, axis=-1)          # average over filters
        heatmap = np.maximum(heatmap, 0)
        heatmap = heatmap / (heatmap.max() + 1e-8)
        return _overlay_heatmap(heatmap, original_bytes)
    except Exception as e:
        print(f"Simple Grad-CAM also failed: {e}")
        return None


def _overlay_heatmap(heatmap: np.ndarray, original_bytes: bytes) -> str:
    """Resize heatmap, overlay on original image, return base64 PNG."""
    heatmap_resized = cv2.resize(heatmap, (settings.img_size, settings.img_size))
    heatmap_uint8 = np.uint8(255 * heatmap_resized)
    heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

    original = np.array(
        Image.open(io.BytesIO(original_bytes))
        .convert("RGB")
        .resize((settings.img_size, settings.img_size))
    )
    superimposed = cv2.addWeighted(original, 0.55, heatmap_colored, 0.45, 0)

    pil_img = Image.fromarray(superimposed)
    buffer = io.BytesIO()
    pil_img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")