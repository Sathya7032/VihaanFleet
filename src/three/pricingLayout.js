/**
 * Desktop "Rental plan & pricing" pose, measured by the section from its own
 * layout (the scooter's top lines up with the eyebrow, the stats under it end
 * on the price card's bottom edge) and read by the 3D stage every frame.
 * null on mobile, where the static pose in stagePoses is used.
 */
let pose = null;

export const setPricingPose = (p) => {
  pose = p;
};

export const getPricingPose = () => pose;
