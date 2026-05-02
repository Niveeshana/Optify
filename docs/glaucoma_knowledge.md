# Glaucoma Knowledge Base for RAG Chatbot

## What is Glaucoma?

Glaucoma is a group of eye conditions that damage the optic nerve, which is essential for good vision. This damage is often caused by abnormally high pressure in the eye (intraocular pressure or IOP). Glaucoma is one of the leading causes of blindness for people over 60, but blindness from glaucoma can often be prevented with early treatment.

## Types of Glaucoma

### Open-angle Glaucoma (Most Common)
Open-angle glaucoma is the most common form, accounting for at least 90% of all glaucoma cases. It is caused by the slow clogging of the drainage canals, resulting in increased eye pressure. Open-angle glaucoma develops slowly and is a lifelong condition. It has a wide and open angle between the iris and cornea, develops slowly and gives no warning signs. It responds well to medication if caught early.

### Angle-closure Glaucoma (Acute or Chronic)
Angle-closure glaucoma is caused by blocked drainage canals, resulting in a sudden rise in intraocular pressure. This type has a closed or narrow angle between the iris and cornea. It develops very quickly, has symptoms and damage that are usually very noticeable, and demands immediate medical attention. It is less common than open-angle glaucoma.

### Normal-tension Glaucoma
In normal-tension glaucoma, the optic nerve is damaged even though the intraocular pressure is not very high. Researchers still don't fully understand why some people's optic nerves are damaged even though they have almost normal pressure levels. It may be that those who develop normal-tension glaucoma have an abnormally sensitive optic nerve or have a reduced blood supply to the optic nerve.

### Secondary Glaucoma
Secondary glaucoma refers to any case in which another disease, condition, or medication causes or contributes to increased eye pressure, resulting in optic nerve damage and vision loss.

## Risk Factors

The following factors can increase the risk of developing glaucoma:
- High intraocular pressure (above 21 mmHg)
- Age over 60 (risk increases significantly with age)
- Family history of glaucoma (first-degree relatives have up to 9x higher risk)
- African, Hispanic, or Asian heritage (higher prevalence in certain ethnic groups)
- Thin corneas (central corneal thickness below 555 micrometers)
- Extreme nearsightedness or farsightedness
- Previous eye injury
- Long-term corticosteroid medication use
- Diabetes, high blood pressure, or sickle cell anemia

## Symptoms

### Early Stage
Most types of glaucoma have no early warning signs. The effect is so gradual that you may not notice a change in vision until the condition is at an advanced stage.

### Advanced Stage
- Patchy blind spots in peripheral (side) or central vision (frequently in both eyes)
- Tunnel vision in the advanced stages
- Severe headache (in acute angle-closure)
- Eye pain (in acute angle-closure)
- Nausea and vomiting (in acute angle-closure)
- Blurred vision (in acute angle-closure)
- Halos around lights (in acute angle-closure)

## Diagnosis Methods

### Tonometry (IOP Measurement)
Tonometry measures the pressure inside the eye. Normal IOP ranges from 12-22 mmHg. Values consistently above 21 mmHg may indicate glaucoma risk but are not definitive.

### Ophthalmoscopy (Optic Nerve Exam)
Ophthalmoscopy is used to examine the shape and color of the optic nerve. If the optic nerve looks unusual, other glaucoma tests may be performed.

### Perimetry (Visual Field Test)
This test checks for gaps in vision by testing the entire field of view. The patient is asked to look straight ahead and indicate when a moving light passes into their peripheral vision.

### Optical Coherence Tomography (OCT)
OCT is a non-invasive imaging test that uses light waves to take cross-section pictures of the retina. OCT can measure the thickness of the nerve fiber layer around the optic disc, which is often affected early in glaucoma.

### Digital Fundus Imaging (DFI)
Digital fundus imaging captures photographs of the interior surface of the eye, including the retina, optic disc, macula, and posterior pole. These images can be analyzed by AI systems like this application to detect signs of glaucoma optic neuropathy (GON).

### Gonioscopy
Gonioscopy examines the drainage angle of the eye — the area where the cornea meets the iris. This helps determine the type of glaucoma.

## Understanding GON (Glaucoma Optic Neuropathy)

Glaucoma optic neuropathy (GON) refers specifically to the optic nerve damage characteristic of glaucoma. Key features include:

### Cup-to-Disc Ratio (CDR)
The optic nerve head has a central depression called the cup. The ratio of the cup diameter to the total disc diameter (CDR) is an important indicator. A CDR above 0.6-0.7 is considered suspicious. Asymmetry between the two eyes is also significant.

### ISNT Rule
In a healthy optic nerve, the inferior neuroretinal rim is thickest, followed by superior, then nasal, then temporal (ISNT). Violation of this rule suggests glaucoma.

### Disc Hemorrhages
Disc hemorrhages (flame-shaped hemorrhages at the optic disc margin) are a risk factor for progression and are seen more often in normal-tension glaucoma.

## Treatment Options

### Eye Drops (First-line Treatment)
- Prostaglandin analogs (latanoprost, bimatoprost): Increase fluid outflow; typically used once daily
- Beta-blockers (timolol): Reduce fluid production
- Alpha-adrenergic agonists (brimonidine): Both reduce production and increase outflow
- Carbonic anhydrase inhibitors (dorzolamide): Reduce fluid production

### Laser Treatments
- Selective Laser Trabeculoplasty (SLT): Improves drainage through the trabecular meshwork
- Laser Peripheral Iridotomy (LPI): Used for angle-closure glaucoma
- Cyclophotocoagulation: Reduces fluid production

### Surgery
- Trabeculectomy: Creates a new drainage pathway
- Tube shunt surgery: Implants a small tube to drain fluid
- Minimally Invasive Glaucoma Surgery (MIGS): Newer techniques with faster recovery

## AI-Assisted Diagnosis — How It Works

This application uses a deep learning model trained on the Hillel Yaffe Glaucoma Dataset (HYGD), which contains 747 digital fundus images (548 GON+, 199 GON−) with gold-standard annotations based on comprehensive ophthalmic examinations.

### Model Architecture
The model is a convolutional neural network (CNN) trained to classify fundus images as GON+ (glaucomatous) or GON− (non-glaucomatous).

### Grad-CAM Explanation
Gradient-weighted Class Activation Mapping (Grad-CAM) highlights the regions of the fundus image that most influenced the model's decision. Warm colors (red/orange) indicate high attention — typically the optic disc region where glaucoma changes are most visible.

### Interpreting Results
- GON+ (Glaucomatous): The model detected features consistent with glaucoma optic neuropathy
- GON− (Non-Glaucomatous): No significant signs of GON detected
- Confidence Score: How certain the model is in its prediction (0-100%)
- Important: This AI tool is for screening assistance only. All results must be confirmed by a qualified ophthalmologist.

## When to See a Doctor Immediately

Seek immediate medical attention if you experience:
- Sudden eye pain
- Sudden onset of visual disturbance
- Blurred vision
- Seeing halos around lights
- Redness of the eye
- Nausea or vomiting accompanying any of the above

These may indicate acute angle-closure glaucoma, which is a medical emergency.

## Living with Glaucoma

### Monitoring
Regular follow-up appointments are essential. Frequency depends on disease severity and stability, typically every 3-12 months.

### Medication Adherence
Eye drops must be used as prescribed, even when no symptoms are present. Missing doses can allow IOP to rise and damage to progress.

### Lifestyle Modifications
- Exercise regularly (moderate aerobic exercise may reduce IOP)
- Avoid activities that dramatically increase IOP (heavy weightlifting, head-down positions)
- Reduce caffeine intake
- Protect eyes from UV light
- Maintain a healthy diet rich in antioxidants

### Mental Health
A glaucoma diagnosis can cause anxiety and depression. Support groups and counseling can be beneficial. Open communication with your ophthalmologist about concerns is important.

## Frequently Asked Questions

### Can glaucoma be cured?
No, glaucoma cannot be cured, but it can be controlled. With proper treatment, most people with glaucoma do not lose their sight.

### Is glaucoma always caused by high eye pressure?
No. Normal-tension glaucoma occurs even with normal IOP. Conversely, not everyone with high IOP develops glaucoma (ocular hypertension).

### Can glaucoma affect both eyes?
Yes, though it often affects one eye more than the other. In open-angle glaucoma, both eyes are usually eventually affected.

### How accurate is AI detection of glaucoma?
AI systems like the one in this application can achieve high accuracy on screening tasks. The HYGD-trained model has demonstrated strong performance on gold-standard annotated data. However, AI screening is not a replacement for full ophthalmological examination.

### What is the difference between GON+ and GON−?
GON+ (Glaucoma Optic Neuropathy positive) means the fundus image shows features consistent with glaucomatous optic nerve damage. GON− means no such features were detected in the image.
