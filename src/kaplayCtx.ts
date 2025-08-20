import kaplay from "kaplay";

const kaplayCtx = kaplay({
    width: 256,
    height: 224,
    letterbox: true,
    touchToMouse: true,
    scale: 4,
    pixelDensity: devicePixelRatio,
    debug: true, // swt to false for production.
    background: [0, 0, 0], // RGBA background color
    global: false, // Set to true if you want to use global variables
});

export default kaplayCtx;