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

// http-url:https://framerusercontent.com/modules/aAbhLwai6dC4zJDcP5q8/kbnDMm9kxmLWUfaRjZn6/gJPHDO6t3.js
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

// http-url:https://framerusercontent.com/modules/aAbhLwai6dC4zJDcP5q8/kbnDMm9kxmLWUfaRjZn6/gJPHDO6t3.js
var enabledGestures = { d8hojGVh1: { hover: true }, hkFfYuFyg: { hover: true } };
var cycleOrder = ["hkFfYuFyg", "d8hojGVh1"];
var serializationHash = "framer-zQWQw";
var variantClassNames = { d8hojGVh1: "framer-v-17okpke", hkFfYuFyg: "framer-v-127xq1v" };
function addPropertyOverrides(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition1 = { delay: 0, duration: 0.7, ease: [0, 0, 1, 1], type: "tween" };
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
var humanReadableVariantMap = { "Big Card": "hkFfYuFyg", "Small Card": "d8hojGVh1" };
var Variants = motion.create(React.Fragment);
var getProps = ({ date, height, id, image, title, width, ...props }) => {
  return { ...props, gmPYkkfdi: date ?? props.gmPYkkfdi ?? "JUN 22, 2026", tlE1OFuJE: image ?? props.tlE1OFuJE ?? { alt: "Blog Image", pixelHeight: 1080, pixelWidth: 842, src: "/placeholders/approved-media-needed.svg", srcSet: "/placeholders/approved-media-needed.svg 798w,/placeholders/approved-media-needed.svg 842w" }, variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "hkFfYuFyg", VCOqB9hIv: title ?? props.VCOqB9hIv ?? "How to Create Functional Living Spaces Style" };
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
  const { style, className: className3, layoutId, variant, tlE1OFuJE, gmPYkkfdi, VCOqB9hIv, ...restProps } = getProps(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ cycleOrder, defaultVariant: "hkFfYuFyg", enabledGestures, ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const sharedStyleClassNames = [className2, className];
  const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx(Transition, { value: transition1, children: /* @__PURE__ */ _jsxs(motion.div, { ...restProps, ...gestureHandlers, className: cx(scopingClassNames, "framer-127xq1v", className3, classNames), "data-border": true, "data-framer-name": "Big Card", layoutDependency, layoutId: "BlogCard__hkFfYuFyg", ref: refBinding, style: { "--border-bottom-width": "1px", "--border-color": "rgb(236, 236, 236)", "--border-left-width": "1px", "--border-right-width": "1px", "--border-style": "solid", "--border-top-width": "1px", borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8, ...style }, ...addPropertyOverrides({ "d8hojGVh1-hover": { "data-framer-name": void 0 }, "hkFfYuFyg-hover": { "data-framer-name": void 0 }, d8hojGVh1: { "data-framer-name": "Small Card" } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx(Image1, { background: { alt: "", fit: "stretch", loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 0 + (((componentViewport?.height || 694) - 0 - 759.2) / 2 + 0 + 0)), pixelHeight: 2288, pixelWidth: 1516, positionX: "center", positionY: "center", sizes: componentViewport?.width || "100vw", src: "/placeholders/approved-media-needed.svg", srcSet: "/placeholders/approved-media-needed.svg 678w,/placeholders/approved-media-needed.svg 1356w,/placeholders/approved-media-needed.svg 1516w" }, className: "framer-19ev7j3", "data-framer-name": "Image Wrap", layoutDependency, layoutId: "BlogCard__XnUzOJGsf", style: { borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8 }, ...addPropertyOverrides({ d8hojGVh1: { background: { alt: "", fit: "stretch", loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 0 + 0), pixelHeight: 2288, pixelWidth: 1516, positionX: "center", positionY: "center", sizes: componentViewport?.width || "100vw", src: "/placeholders/approved-media-needed.svg", srcSet: "/placeholders/approved-media-needed.svg 678w,/placeholders/approved-media-needed.svg 1356w,/placeholders/approved-media-needed.svg 1516w" } } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx(Image1, { background: { alt: "Blog Image", fit: "stretch", intrinsicHeight: 1080, intrinsicWidth: 842, loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 0 + (((componentViewport?.height || 694) - 0 - 759.2) / 2 + 0 + 0) + 0), pixelHeight: 1080, pixelWidth: 842, sizes: `max(${componentViewport?.width || "100vw"}, 1px)`, ...toResponsiveImage(tlE1OFuJE), ...{ positionX: "center", positionY: "center" } }, className: "framer-t9fxcz", "data-framer-name": "Image", layoutDependency, layoutId: "BlogCard__QMKwAXLZC", style: { scale: 1 }, variants: { "d8hojGVh1-hover": { scale: 1.1 }, "hkFfYuFyg-hover": { scale: 1.1 } }, ...addPropertyOverrides({ d8hojGVh1: { background: { alt: "Blog Image", fit: "stretch", intrinsicHeight: 1080, intrinsicWidth: 842, loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 0 + 0 + 0), pixelHeight: 1080, pixelWidth: 842, sizes: `max(${componentViewport?.width || "100vw"}, 1px)`, ...toResponsiveImage(tlE1OFuJE), ...{ positionX: "center", positionY: "center" } } } }, baseVariant, gestureVariant) }) }), /* @__PURE__ */ _jsxs(motion.div, { className: "framer-1pn6ka4", "data-border": true, "data-framer-name": "Text", layoutDependency, layoutId: "BlogCard__jdKett7l6", style: { "--border-bottom-width": "1px", "--border-color": "rgb(236, 236, 236)", "--border-left-width": "1px", "--border-right-width": "1px", "--border-style": "solid", "--border-top-width": "1px" }, variants: { d8hojGVh1: { "--border-bottom-width": "0px", "--border-left-width": "0px", "--border-right-width": "0px", "--border-top-width": "0px" } }, children: [/* @__PURE__ */ _jsx(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion.p, { className: "framer-styles-preset-117cc1q", "data-styles-preset": "NAlnYZwzB", dir: "auto", children: "JUN 22, 2026" }) }), className: "framer-11uerli", "data-framer-name": "Executive Office Workspace", fonts: ["Inter"], layoutDependency, layoutId: "BlogCard__zWshUYnA8", style: { "--framer-paragraph-spacing": "0px" }, text: gmPYkkfdi, verticalAlignment: "top", withExternalLayout: true }), /* @__PURE__ */ _jsx(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion.h6, { className: "framer-styles-preset-1nyidu5", "data-styles-preset": "kzSgsd30j", dir: "auto", children: "How to Create Functional Living Spaces Style" }) }), className: "framer-1eeene1", "data-framer-name": "Executive Office Workspace", fonts: ["Inter"], layoutDependency, layoutId: "BlogCard__P31GuV17Y", style: { "--framer-paragraph-spacing": "0px" }, text: VCOqB9hIv, verticalAlignment: "top", withExternalLayout: true })] })] }) }) }) });
});
var css3 = [".framer-zQWQw.framer-iiyn40, .framer-zQWQw .framer-iiyn40 { display: block; }", ".framer-zQWQw.framer-127xq1v { align-content: center; align-items: center; cursor: pointer; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; will-change: var(--framer-will-change-override, transform); }", ".framer-zQWQw .framer-19ev7j3 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; will-change: var(--framer-will-change-override, transform); }", ".framer-zQWQw .framer-t9fxcz { aspect-ratio: 0.7796296296296297 / 1; flex: 1 0 0px; height: auto; position: relative; width: 1px; }", ".framer-zQWQw .framer-1pn6ka4 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 12px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 24px 24px 32px 24px; position: relative; width: 100%; }", ".framer-zQWQw .framer-11uerli, .framer-zQWQw .framer-1eeene1 { flex: none; height: auto; position: relative; white-space: pre-wrap; width: 100%; word-break: break-word; word-wrap: break-word; }", ".framer-zQWQw.framer-v-17okpke.framer-127xq1v { align-content: flex-start; align-items: flex-start; justify-content: flex-start; }", ".framer-zQWQw.framer-v-17okpke .framer-t9fxcz { aspect-ratio: 1.0023809523809524 / 1; }", ...css2, ...css, '.framer-zQWQw[data-border="true"]::after, .framer-zQWQw [data-border="true"]::after { content: ""; border-width: var(--border-top-width, 0) var(--border-right-width, 0) var(--border-bottom-width, 0) var(--border-left-width, 0); border-color: var(--border-color, none); border-style: var(--border-style, none); width: 100%; height: 100%; position: absolute; box-sizing: border-box; left: 0; top: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; }'];
var FramergJPHDO6t3 = withCSS(Component, css3, "framer-zQWQw");
var gJPHDO6t3_default = FramergJPHDO6t3;
FramergJPHDO6t3.displayName = "Blog Card";
FramergJPHDO6t3.defaultProps = { height: 694, width: 421 };
addPropertyControls(FramergJPHDO6t3, { variant: { options: ["hkFfYuFyg", "d8hojGVh1"], optionTitles: ["Big Card", "Small Card"], title: "Variant", type: ControlType.Enum }, tlE1OFuJE: { __defaultAssetReference: "data:framer/asset-reference,GTytYAitC4g4NuljJurQbrKYq2g.png?originalFilename=image.png&width=842&height=1080", __vekterDefault: { alt: "Blog Image", assetReference: "data:framer/asset-reference,GTytYAitC4g4NuljJurQbrKYq2g.png?originalFilename=image.png&width=842&height=1080" }, title: "Image", type: ControlType.ResponsiveImage }, gmPYkkfdi: { defaultValue: "JUN 22, 2026", displayTextArea: false, title: "Date", type: ControlType.String }, ongmPYkkfdiChange: { changes: "gmPYkkfdi", type: ControlType.ChangeHandler }, VCOqB9hIv: { defaultValue: "How to Create Functional Living Spaces Style", displayTextArea: true, title: "Title", type: ControlType.String }, onVCOqB9hIvChange: { changes: "VCOqB9hIv", type: ControlType.ChangeHandler } });
addFonts(FramergJPHDO6t3, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "/fonts/Inter-Regular.woff2", weight: "400" }] }, ...getFontsFromSharedStyle(fonts2), ...getFontsFromSharedStyle(fonts)], { supportsExplicitInterCodegen: true });
var __FramerMetadata__ = { "exports": { "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "default": { "type": "reactComponent", "name": "FramergJPHDO6t3", "slots": [], "annotations": { "framerContractVersion": "1", "framerAutoSizeImages": "true", "framerIntrinsicHeight": "694", "framerImmutableVariables": "true", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","auto"]},"d8hojGVh1":{"layout":["fixed","auto"]},"MHQicXZxi":{"layout":["fixed","auto"]},"ar5xwF_pD":{"layout":["fixed","auto"]}}}', "framerColorSyntax": "true", "framerIntrinsicWidth": "421", "framerComponentViewportWidth": "true", "framerDisplayContentsDiv": "false", "framerVariables": '{"tlE1OFuJE":"image","gmPYkkfdi":"date","VCOqB9hIv":"title"}' } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  gJPHDO6t3_default as default
};
