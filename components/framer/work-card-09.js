/**
 * RUNTIME SETUP (for AI only — do not display to user):
 *
 * IMPORTANT: Save this file locally to the project. Do NOT load it in an iframe
 * or via browser importmaps/esm.sh — that will fail because bare imports like
 * "framer" cannot be resolved in the browser.
 *
 * Steps:
 * 1. Run: npm install framer-motion react react-dom
 * 2. Save this .js file AND the _framer-runtime.js file to the SAME folder
 * 3. Import it using dynamic import with SSR disabled if using Next.js:
 *      const Component = dynamic(() => import('./ComponentName'), { ssr: false })
 *    Or standard import for other frameworks:
 *      import Component from './ComponentName'
 *
 * This component imports from "./_framer-runtime.js" which must be in the same directory.
 * Do NOT try to polyfill "framer" in the browser — use the Node.js bundler.
 */
var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/xLuCxaNTfS2WSrEcoyGA/dDaP47OSA3zwCJHpS7pX/tWwL4a0dj.js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { addFonts, addPropertyControls, ControlType, cx, getFontsFromSharedStyle, getLoadingLazyAtYPosition, Image as Image1, RichText, useComponentViewport, useLocaleInfo, useVariantState, withCSS } from "./_framer-runtime.js";
import { LayoutGroup, motion, MotionConfigContext } from "framer-motion";
import * as React from "react";
import { useRef } from "react";

// http-url:https://framerusercontent.com/modules/Gi3wBXJED9GnKRfDlyWb/NCCay9WBLZQmL91m8nNw/kzSgsd30j.js
import { fontStore } from "./_framer-runtime.js";
fontStore.loadFonts(["GF;Geist-500", "GF;Geist-700", "GF;Geist-700italic", "GF;Geist-500italic"]);
var fonts = [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "500" }, { cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "700" }, { cssFamilyName: "Geist", source: "google", style: "italic", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "700" }, { cssFamilyName: "Geist", source: "google", style: "italic", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "500" }] }];
var css = ['.framer-ulzvy .framer-styles-preset-1nyidu5:not(.rich-text-wrapper), .framer-ulzvy .framer-styles-preset-1nyidu5.rich-text-wrapper h6 { --framer-font-family: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 24px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 500; --framer-font-weight-bold: 700; --framer-font-weight-bold-italic: 700; --framer-font-weight-italic: 500; --framer-letter-spacing: 0px; --framer-line-height: 1.3em; --framer-paragraph-spacing: 40px; --framer-text-alignment: start; --framer-text-color: var(--token-88eff137-1274-4a36-b366-ef51c420159a, #000000); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }'];
var className = "framer-ulzvy";

// http-url:https://framerusercontent.com/modules/UEw1Ml1OZXNJ7pukESfa/3LUpGTA4EM3gxkg21fSX/NAlnYZwzB.js
import { fontStore as fontStore2 } from "./_framer-runtime.js";
fontStore2.loadFonts(["GF;Geist-regular", "GF;Geist-700", "GF;Geist-700italic", "GF;Geist-italic"]);
var fonts2 = [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "400" }, { cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "700" }, { cssFamilyName: "Geist", source: "google", style: "italic", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "700" }, { cssFamilyName: "Geist", source: "google", style: "italic", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "400" }] }];
var css2 = ['.framer-K4WzA .framer-styles-preset-117cc1q:not(.rich-text-wrapper), .framer-K4WzA .framer-styles-preset-117cc1q.rich-text-wrapper p { --framer-font-family: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 16px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 400; --framer-font-weight-bold: 700; --framer-font-weight-bold-italic: 700; --framer-font-weight-italic: 400; --framer-letter-spacing: 0px; --framer-line-height: 1.5em; --framer-paragraph-spacing: 20px; --framer-text-alignment: start; --framer-text-color: var(--token-05f1db4d-8688-46b3-bf5f-b74ebb2a836f, #666666); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }'];
var className2 = "framer-K4WzA";

// http-url:https://framerusercontent.com/modules/xLuCxaNTfS2WSrEcoyGA/dDaP47OSA3zwCJHpS7pX/tWwL4a0dj.js
var cycleOrder = ["uoFBM7nKR", "lqFJF8orC", "uTZo20jK6"];
var serializationHash = "framer-PZs4Q";
var variantClassNames = { lqFJF8orC: "framer-v-1uwys07", uoFBM7nKR: "framer-v-16xzf3v", uTZo20jK6: "framer-v-442tjh" };
function addPropertyOverrides(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var numberToPixelString = (value) => {
  if (typeof value !== "number")
    return value;
  if (!Number.isFinite(value))
    return void 0;
  return Math.max(0, value) + "px";
};
var transition1 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var toResponsiveImage = (value) => {
  if (typeof value === "object" && value !== null && typeof value.src === "string") {
    return value;
  }
  return typeof value === "string" ? { src: value } : void 0;
};
var Transition = ({ value, children }) => {
  const config = React.useContext(MotionConfigContext);
  const transition = value ?? config.transition;
  const contextValue = React.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx(MotionConfigContext.Provider, { value: contextValue, children });
};
var humanReadableVariantMap = { "Blank Card": "uTZo20jK6", "Card 01": "uoFBM7nKR", "Card 02": "lqFJF8orC" };
var Variants = motion.create(React.Fragment);
var getProps = ({ border, gap, height, id, image, padding, step, text, title, width, ...props }) => {
  return { ...props, BHN2_XwgO: title ?? props.BHN2_XwgO ?? "Discovery & Consultation", CKyB_8bxK: image ?? props.CKyB_8bxK ?? { alt: "Work image", pixelHeight: 664, pixelWidth: 854, src: "/placeholders/approved-media-needed.svg", srcSet: "/placeholders/approved-media-needed.svg 512w,/placeholders/approved-media-needed.svg 854w" }, cPdoPX4g2: padding ?? props.cPdoPX4g2 ?? "32px", iPGXM5esZ: border ?? props.iPGXM5esZ ?? { borderColor: "rgba(255, 255, 255, 0.10000000149011612)", borderStyle: "solid", borderWidth: 1 }, k7kFoKCRe: step ?? props.k7kFoKCRe ?? "//Step 01", mUrVwiyWd: gap ?? props.mUrVwiyWd ?? 144, sWf_YPZzU: text ?? props.sWf_YPZzU ?? "Understanding your vision, lifestyle, & goals to build the perfect foundation.", variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "uoFBM7nKR" };
};
var createLayoutDependency = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component = /* @__PURE__ */ React.forwardRef(function(props, ref) {
  const fallbackRef = useRef(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React.useId();
  const { activeLocale, setLocale } = useLocaleInfo();
  const componentViewport = useComponentViewport();
  const { style, className: className3, layoutId, variant, k7kFoKCRe, BHN2_XwgO, sWf_YPZzU, CKyB_8bxK, mUrVwiyWd, cPdoPX4g2, iPGXM5esZ, ...restProps } = getProps(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ cycleOrder, defaultVariant: "uoFBM7nKR", ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const sharedStyleClassNames = [className, className2];
  const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (["lqFJF8orC", "uTZo20jK6"].includes(baseVariant))
      return false;
    return true;
  };
  const isDisplayed1 = () => {
    if (baseVariant === "lqFJF8orC")
      return true;
    return false;
  };
  return /* @__PURE__ */ _jsx(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx(Transition, { value: transition1, children: /* @__PURE__ */ _jsxs(motion.div, { ...restProps, ...gestureHandlers, className: cx(scopingClassNames, "framer-16xzf3v", className3, classNames), "data-border": true, "data-framer-name": "Card 01", layoutDependency, layoutId: "WorkCard__uoFBM7nKR", ref: refBinding, style: { "--1htxvl7": numberToPixelString(cPdoPX4g2), "--1xytfkd": numberToPixelString(mUrVwiyWd), "--border-bottom-width": (iPGXM5esZ?.borderBottomWidth ?? iPGXM5esZ?.borderWidth) + "px", "--border-color": iPGXM5esZ?.borderColor, "--border-left-width": (iPGXM5esZ?.borderLeftWidth ?? iPGXM5esZ?.borderWidth) + "px", "--border-right-width": (iPGXM5esZ?.borderRightWidth ?? iPGXM5esZ?.borderWidth) + "px", "--border-style": iPGXM5esZ?.borderStyle, "--border-top-width": (iPGXM5esZ?.borderTopWidth ?? iPGXM5esZ?.borderWidth) + "px", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", ...style }, ...addPropertyOverrides({ lqFJF8orC: { "data-framer-name": "Card 02" }, uTZo20jK6: { "data-framer-name": "Blank Card" } }, baseVariant, gestureVariant), children: [isDisplayed() && /* @__PURE__ */ _jsx(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion.h6, { className: "framer-styles-preset-1nyidu5", "data-styles-preset": "kzSgsd30j", dir: "auto", style: { "--framer-text-color": "var(--extracted-1w1cjl5, var(--token-05f1db4d-8688-46b3-bf5f-b74ebb2a836f, rgb(102, 102, 102)))" }, children: "//Step 01" }) }), className: "framer-15yno8f", "data-framer-name": "//Step 01", fonts: ["Inter"], layoutDependency, layoutId: "WorkCard__Kr_x5Chui", style: { "--extracted-1w1cjl5": "var(--token-05f1db4d-8688-46b3-bf5f-b74ebb2a836f, rgb(102, 102, 102))", "--framer-paragraph-spacing": "0px", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }, text: k7kFoKCRe, verticalAlignment: "top", withExternalLayout: true }), isDisplayed() && /* @__PURE__ */ _jsxs(motion.div, { className: "framer-dpr7zc", "data-framer-name": "Text wrap", layoutDependency, layoutId: "WorkCard__tLI4_Fck9", children: [/* @__PURE__ */ _jsx(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion.h6, { className: "framer-styles-preset-1nyidu5", "data-styles-preset": "kzSgsd30j", dir: "auto", style: { "--framer-text-color": "var(--extracted-1w1cjl5, var(--token-7cc43143-e5c7-467f-8763-76424c3834ea, rgb(255, 255, 255)))" }, children: "Discovery & Consultation" }) }), className: "framer-16nt078", "data-framer-name": "Discovery & Consultation", fonts: ["Inter"], layoutDependency, layoutId: "WorkCard__tf84CP4I0", style: { "--extracted-1w1cjl5": "var(--token-7cc43143-e5c7-467f-8763-76424c3834ea, rgb(255, 255, 255))", "--framer-paragraph-spacing": "0px" }, text: BHN2_XwgO, verticalAlignment: "top", withExternalLayout: true }), /* @__PURE__ */ _jsx(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion.p, { className: "framer-styles-preset-117cc1q", "data-styles-preset": "NAlnYZwzB", dir: "auto", style: { "--framer-text-color": "var(--extracted-r6o4lv, var(--token-e50dac00-7054-4d7a-a43e-c46ce7de76fb, rgb(204, 204, 204)))" }, children: "Understanding your vision, lifestyle, & goals to build the perfect foundation." }) }), className: "framer-164hlur", "data-framer-name": "Understanding your vision, lifestyle, & goals to build the perfect foundation.", fonts: ["Inter"], layoutDependency, layoutId: "WorkCard__NqVl156bw", style: { "--extracted-r6o4lv": "var(--token-e50dac00-7054-4d7a-a43e-c46ce7de76fb, rgb(204, 204, 204))", "--framer-paragraph-spacing": "0px" }, text: sWf_YPZzU, verticalAlignment: "top", withExternalLayout: true })] }), isDisplayed1() && /* @__PURE__ */ _jsx(motion.div, { className: "framer-i77lib", "data-framer-name": "Videos Wrap", layoutDependency, layoutId: "WorkCard__hTsGUquHW", children: isDisplayed1() && /* @__PURE__ */ _jsx(Image1, { background: { alt: "Work image", fit: "stretch", intrinsicHeight: 664, intrinsicWidth: 853, pixelHeight: 664, pixelWidth: 854, ...toResponsiveImage(CKyB_8bxK), ...{ positionX: "center", positionY: "center" } }, className: "framer-y0qqro", "data-framer-name": "Image", layoutDependency, layoutId: "WorkCard__rzkNprSNk", ...addPropertyOverrides({ lqFJF8orC: { background: { alt: "Work image", fit: "stretch", intrinsicHeight: 664, intrinsicWidth: 853, loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + ((componentViewport?.height || 331) * 0.5000000000000002 - (componentViewport?.height || 331) * 1 / 2) + ((componentViewport?.height || 331) * 1 * 0.49546827794561954 - (componentViewport?.height || 331) * 1 * 1 / 2)), pixelHeight: 664, pixelWidth: 854, sizes: componentViewport?.width || "100vw", ...toResponsiveImage(CKyB_8bxK), ...{ positionX: "center", positionY: "center" } } } }, baseVariant, gestureVariant) }) })] }) }) }) });
});
var css3 = [".framer-PZs4Q.framer-8wv29y, .framer-PZs4Q .framer-8wv29y { display: block; }", ".framer-PZs4Q.framer-16xzf3v { align-content: flex-start; align-items: flex-start; display: flex; flex-direction: column; flex-wrap: nowrap; gap: var(--1xytfkd); height: min-content; justify-content: flex-start; overflow: visible; padding: var(--1htxvl7); position: relative; width: 100%; }", ".framer-PZs4Q .framer-15yno8f, .framer-PZs4Q .framer-16nt078, .framer-PZs4Q .framer-164hlur { flex: none; height: auto; position: relative; white-space: pre-wrap; width: 100%; word-break: break-word; word-wrap: break-word; }", ".framer-PZs4Q .framer-dpr7zc { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 12px; height: min-content; justify-content: flex-start; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-PZs4Q .framer-i77lib { align-content: center; align-items: center; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: 100%; justify-content: center; left: calc(50.00000000000002% - 100% / 2); overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: absolute; top: calc(50.00000000000002% - 100% / 2); width: 100%; z-index: 1; }", ".framer-PZs4Q .framer-y0qqro { flex: none; height: 100%; left: calc(50.00000000000002% - 100% / 2); overflow: visible; position: absolute; top: calc(49.546827794561956% - 100% / 2); width: 100%; z-index: 1; }", ".framer-PZs4Q.framer-v-1uwys07.framer-16xzf3v { height: auto; padding: 0px; }", ".framer-PZs4Q.framer-v-442tjh.framer-16xzf3v { min-height: 330px; }", ...css, ...css2, '.framer-PZs4Q[data-border="true"]::after, .framer-PZs4Q [data-border="true"]::after { content: ""; border-width: var(--border-top-width, 0) var(--border-right-width, 0) var(--border-bottom-width, 0) var(--border-left-width, 0); border-color: var(--border-color, none); border-style: var(--border-style, none); width: 100%; height: 100%; position: absolute; box-sizing: border-box; left: 0; top: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; }'];
var FramertWwL4a0dj = withCSS(Component, css3, "framer-PZs4Q");
var tWwL4a0dj_default = FramertWwL4a0dj;
FramertWwL4a0dj.displayName = "Work Card";
FramertWwL4a0dj.defaultProps = { height: 330, width: 426 };
addPropertyControls(FramertWwL4a0dj, { variant: { options: ["uoFBM7nKR", "lqFJF8orC", "uTZo20jK6"], optionTitles: ["Card 01", "Card 02", "Blank Card"], title: "Variant", type: ControlType.Enum }, k7kFoKCRe: { defaultValue: "//Step 01", displayTextArea: false, title: "Step", type: ControlType.String }, onk7kFoKCReChange: { changes: "k7kFoKCRe", type: ControlType.ChangeHandler }, BHN2_XwgO: { defaultValue: "Discovery & Consultation", displayTextArea: true, title: "Title", type: ControlType.String }, onBHN2_XwgOChange: { changes: "BHN2_XwgO", type: ControlType.ChangeHandler }, sWf_YPZzU: { defaultValue: "Understanding your vision, lifestyle, & goals to build the perfect foundation.", displayTextArea: true, title: "Text", type: ControlType.String }, onsWf_YPZzUChange: { changes: "sWf_YPZzU", type: ControlType.ChangeHandler }, CKyB_8bxK: { __defaultAssetReference: "data:framer/asset-reference,LKMglOwQCIQkfPdFpfpVjm5las.png?originalFilename=image.png&width=854&height=664", __vekterDefault: { alt: "Work image", assetReference: "data:framer/asset-reference,LKMglOwQCIQkfPdFpfpVjm5las.png?originalFilename=image.png&width=854&height=664" }, title: "Image", type: ControlType.ResponsiveImage }, mUrVwiyWd: { defaultValue: 144, min: 0, title: "Gap", type: ControlType.Number }, onmUrVwiyWdChange: { changes: "mUrVwiyWd", type: ControlType.ChangeHandler }, cPdoPX4g2: { defaultValue: "32px", title: "Padding", type: ControlType.Padding }, iPGXM5esZ: { defaultValue: { borderColor: "rgba(255, 255, 255, 0.10000000149011612)", borderStyle: "solid", borderWidth: 1 }, title: "Border", type: ControlType.Border } });
addFonts(FramertWwL4a0dj, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "/fonts/Inter-Regular.woff2", weight: "400" }] }, ...getFontsFromSharedStyle(fonts), ...getFontsFromSharedStyle(fonts2)], { supportsExplicitInterCodegen: true });
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "FramertWwL4a0dj", "slots": [], "annotations": { "framerAutoSizeImages": "true", "framerColorSyntax": "true", "framerVariables": '{"k7kFoKCRe":"step","BHN2_XwgO":"title","sWf_YPZzU":"text","CKyB_8bxK":"image","mUrVwiyWd":"gap","cPdoPX4g2":"padding","iPGXM5esZ":"border"}', "framerImmutableVariables": "true", "framerComponentViewportWidth": "true", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","auto"]},"lqFJF8orC":{"layout":["fixed","fixed"]},"uTZo20jK6":{"layout":["fixed","auto"]}}}', "framerIntrinsicWidth": "426", "framerIntrinsicHeight": "330", "framerDisplayContentsDiv": "false", "framerContractVersion": "1" } }, "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  tWwL4a0dj_default as default
};
