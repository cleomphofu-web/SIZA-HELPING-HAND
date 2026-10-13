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

// http-url:https://framerusercontent.com/modules/srPuaAAHDmVJoA2ZNnBN/PuvqV9TxBxqQUZ7mLjMH/cAxo1DRKN.js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { addFonts, addPropertyControls, ControlType, cx, getFontsFromSharedStyle, Image as Image1, parsePaddingString, RichText, useComponentViewport, useLocaleInfo, useVariantState, withCSS } from "./_framer-runtime.js";
import { LayoutGroup, motion, MotionConfigContext } from "framer-motion";
import * as React from "react";
import { useRef } from "react";

// http-url:https://framerusercontent.com/modules/Gi3wBXJED9GnKRfDlyWb/NCCay9WBLZQmL91m8nNw/kzSgsd30j.js
import { fontStore } from "./_framer-runtime.js";
fontStore.loadFonts(["GF;Geist-500", "GF;Geist-700", "GF;Geist-700italic", "GF;Geist-500italic"]);
var fonts = [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "500" }, { cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "700" }, { cssFamilyName: "Geist", source: "google", style: "italic", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "700" }, { cssFamilyName: "Geist", source: "google", style: "italic", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "500" }] }];
var css = ['.framer-ulzvy .framer-styles-preset-1nyidu5:not(.rich-text-wrapper), .framer-ulzvy .framer-styles-preset-1nyidu5.rich-text-wrapper h6 { --framer-font-family: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 24px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 500; --framer-font-weight-bold: 700; --framer-font-weight-bold-italic: 700; --framer-font-weight-italic: 500; --framer-letter-spacing: 0px; --framer-line-height: 1.3em; --framer-paragraph-spacing: 40px; --framer-text-alignment: start; --framer-text-color: var(--token-88eff137-1274-4a36-b366-ef51c420159a, #000000); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }'];
var className = "framer-ulzvy";

// http-url:https://framerusercontent.com/modules/LjCByAr3Ho1TiYO71866/MYhO82DptPZvwc4WX0TA/Vzil4J3i1.js
import { fontStore as fontStore2 } from "./_framer-runtime.js";
fontStore2.loadFonts(["GF;Geist-500", "GF;Geist-700", "GF;Geist-700italic", "GF;Geist-500italic"]);
var fonts2 = [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "500" }, { cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "700" }, { cssFamilyName: "Geist", source: "google", style: "italic", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "700" }, { cssFamilyName: "Geist", source: "google", style: "italic", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "500" }] }];
var css2 = ['.framer-aJYlG .framer-styles-preset-w7n75z:not(.rich-text-wrapper), .framer-aJYlG .framer-styles-preset-w7n75z.rich-text-wrapper p { --framer-font-family: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 20px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 500; --framer-font-weight-bold: 700; --framer-font-weight-bold-italic: 700; --framer-font-weight-italic: 500; --framer-letter-spacing: 0px; --framer-line-height: 1.4em; --framer-paragraph-spacing: 20px; --framer-text-alignment: start; --framer-text-color: var(--token-ac0c662b-4250-4586-9bed-0f686bea2a4e, #b3b3b3); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }'];
var className2 = "framer-aJYlG";

// http-url:https://framerusercontent.com/modules/srPuaAAHDmVJoA2ZNnBN/PuvqV9TxBxqQUZ7mLjMH/cAxo1DRKN.js
var enabledGestures = { JHFWi4Fq0: { hover: true }, z8Q1sgqUI: { hover: true } };
var cycleOrder = ["z8Q1sgqUI", "JHFWi4Fq0"];
var serializationHash = "framer-3sDbz";
var variantClassNames = { JHFWi4Fq0: "framer-v-ni5iek", z8Q1sgqUI: "framer-v-141rkfp" };
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
var humanReadableVariantMap = { "Big card": "z8Q1sgqUI", "Small Card": "JHFWi4Fq0" };
var Variants = motion.create(React.Fragment);
var getProps = ({ height, id, image, location, padding, title, width, year, ...props }) => {
  return { ...props, dT_K6ZFq1: title ?? props.dT_K6ZFq1 ?? "Executive Office Workspace", haGa7eoma: year ?? props.haGa7eoma ?? "( 2026)", IienP9oz0: location ?? props.IienP9oz0 ?? "Los Angeles, USA", iiHNY3XXA: image ?? props.iiHNY3XXA ?? { pixelHeight: 1680, pixelWidth: 1684, src: "/placeholders/approved-media-needed.svg", srcSet: "/placeholders/approved-media-needed.svg 512w,/placeholders/approved-media-needed.svg 1024w,/placeholders/approved-media-needed.svg 1684w" }, n6hjgFBgX: padding ?? props.n6hjgFBgX ?? "24px 24px 32px 24px", variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "z8Q1sgqUI" };
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
  const { style, className: className3, layoutId, variant, IienP9oz0, haGa7eoma, iiHNY3XXA, dT_K6ZFq1, n6hjgFBgX, ...restProps } = getProps(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ cycleOrder, defaultVariant: "z8Q1sgqUI", enabledGestures, ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const sharedStyleClassNames = [className2, className];
  const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
  const parsedPadding = typeof n6hjgFBgX === "string" ? parsePaddingString(n6hjgFBgX) : { top: n6hjgFBgX, right: n6hjgFBgX, bottom: n6hjgFBgX, left: n6hjgFBgX };
  return /* @__PURE__ */ _jsx(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx(Transition, { value: transition1, children: /* @__PURE__ */ _jsxs(motion.div, { ...restProps, ...gestureHandlers, className: cx(scopingClassNames, "framer-141rkfp", className3, classNames), "data-border": true, "data-framer-name": "Big card", layoutDependency, layoutId: "ProjectCard__z8Q1sgqUI", ref: refBinding, style: { "--1r0e9m9": numberToPixelString(n6hjgFBgX), "--border-bottom-width": "1px", "--border-color": "rgb(236, 236, 236)", "--border-left-width": "1px", "--border-right-width": "1px", "--border-style": "solid", "--border-top-width": "1px", ...style }, ...addPropertyOverrides({ "JHFWi4Fq0-hover": { "data-framer-name": void 0 }, "z8Q1sgqUI-hover": { "data-framer-name": void 0 }, JHFWi4Fq0: { "data-framer-name": "Small Card" } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsxs(motion.div, { className: "framer-1xbownl", "data-framer-name": "Locations", layoutDependency, layoutId: "ProjectCard__LDWtp0sbh", children: [/* @__PURE__ */ _jsx(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion.p, { className: "framer-styles-preset-w7n75z", "data-styles-preset": "Vzil4J3i1", dir: "auto", children: "Los Angeles, USA" }) }), className: "framer-1aqyf9e", "data-framer-name": "Nav item", fonts: ["Inter"], layoutDependency, layoutId: "ProjectCard__ch653_qlc", style: { "--framer-paragraph-spacing": "0px" }, text: IienP9oz0, verticalAlignment: "top", withExternalLayout: true }), /* @__PURE__ */ _jsx(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion.p, { className: "framer-styles-preset-w7n75z", "data-styles-preset": "Vzil4J3i1", dir: "auto", style: { "--framer-text-alignment": "end" }, children: "( 2026)" }) }), className: "framer-1ubwq31", "data-framer-name": "Nav item", fonts: ["Inter"], layoutDependency, layoutId: "ProjectCard__UBFOVKZ_1", style: { "--framer-paragraph-spacing": "0px" }, text: haGa7eoma, verticalAlignment: "top", withExternalLayout: true })] }), /* @__PURE__ */ _jsxs(motion.div, { className: "framer-1rm3fu5", "data-framer-name": "Image Wrap", layoutDependency, layoutId: "ProjectCard__ZXxocfi_q", style: { borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8 }, children: [/* @__PURE__ */ _jsx(Image1, { background: { alt: "", fit: "stretch", pixelHeight: 1696, pixelWidth: 1516, positionX: "center", positionY: "center", sizes: `calc((${componentViewport?.width || "100vw"} - ${(parsedPadding?.left ?? 0) + (parsedPadding?.right ?? 0)}px) * 1.0026)`, src: "/placeholders/approved-media-needed.svg", srcSet: "/placeholders/approved-media-needed.svg 915w,/placeholders/approved-media-needed.svg 1516w" }, className: "framer-1g05kkt", "data-framer-name": "BG", layoutDependency, layoutId: "ProjectCard__W2Y0cnOPN", style: { opacity: 0.08 } }), /* @__PURE__ */ _jsx(Image1, { background: { alt: "Project Image", fit: "stretch", pixelHeight: 1680, pixelWidth: 1684, sizes: `max(${componentViewport?.width || "100vw"} - ${(parsedPadding?.left ?? 0) + (parsedPadding?.right ?? 0)}px, 1px)`, ...toResponsiveImage(iiHNY3XXA), ...{ positionX: "center", positionY: "center" } }, className: "framer-jjxv31", "data-framer-name": "Image", layoutDependency, layoutId: "ProjectCard__u8mYLksUC", style: { opacity: 1, scale: 1 }, variants: { "JHFWi4Fq0-hover": { opacity: 0.6, scale: 1.1 }, "z8Q1sgqUI-hover": { opacity: 0.6, scale: 1.1 } } })] }), /* @__PURE__ */ _jsx(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion.h6, { className: "framer-styles-preset-1nyidu5", "data-styles-preset": "kzSgsd30j", dir: "auto", children: "Executive Office Workspace" }) }), className: "framer-1js2lpc", "data-framer-name": "Executive Office Workspace", fonts: ["Inter"], layoutDependency, layoutId: "ProjectCard__R7EjmN8ZK", style: { "--framer-paragraph-spacing": "0px" }, text: dT_K6ZFq1, verticalAlignment: "top", withExternalLayout: true })] }) }) }) });
});
var css3 = [".framer-3sDbz.framer-1q0j82i, .framer-3sDbz .framer-1q0j82i { display: block; }", ".framer-3sDbz.framer-141rkfp { align-content: center; align-items: center; cursor: pointer; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 24px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: var(--1r0e9m9); position: relative; width: 100%; }", ".framer-3sDbz .framer-1xbownl { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; height: min-content; justify-content: space-between; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-3sDbz .framer-1aqyf9e, .framer-3sDbz .framer-1ubwq31 { flex: 1 0 0px; height: auto; position: relative; white-space: pre-wrap; width: 1px; word-break: break-word; word-wrap: break-word; }", ".framer-3sDbz .framer-1rm3fu5 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; will-change: var(--framer-will-change-override, transform); }", ".framer-3sDbz .framer-1g05kkt { flex: none; height: 100%; left: calc(49.735449735449755% - 100.26455026455025% / 2); position: absolute; top: calc(50.00000000000002% - 100% / 2); width: 100%; z-index: 1; }", ".framer-3sDbz .framer-jjxv31 { aspect-ratio: 0.6608391608391608 / 1; flex: 1 0 0px; height: auto; position: relative; width: 1px; }", ".framer-3sDbz .framer-1js2lpc { flex: none; height: auto; position: relative; white-space: pre-wrap; width: 100%; word-break: break-word; word-wrap: break-word; }", ".framer-3sDbz.framer-v-ni5iek .framer-jjxv31 { aspect-ratio: 0.8915094339622641 / 1; }", ...css2, ...css, '.framer-3sDbz[data-border="true"]::after, .framer-3sDbz [data-border="true"]::after { content: ""; border-width: var(--border-top-width, 0) var(--border-right-width, 0) var(--border-bottom-width, 0) var(--border-left-width, 0); border-color: var(--border-color, none); border-style: var(--border-style, none); width: 100%; height: 100%; position: absolute; box-sizing: border-box; left: 0; top: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; }'];
var FramercAxo1DRKN = withCSS(Component, css3, "framer-3sDbz");
var cAxo1DRKN_default = FramercAxo1DRKN;
FramercAxo1DRKN.displayName = "Project Card";
FramercAxo1DRKN.defaultProps = { height: 735, width: 426 };
addPropertyControls(FramercAxo1DRKN, { variant: { options: ["z8Q1sgqUI", "JHFWi4Fq0"], optionTitles: ["Big card", "Small Card"], title: "Variant", type: ControlType.Enum }, IienP9oz0: { defaultValue: "Los Angeles, USA", displayTextArea: false, title: "Location", type: ControlType.String }, onIienP9oz0Change: { changes: "IienP9oz0", type: ControlType.ChangeHandler }, haGa7eoma: { defaultValue: "( 2026)", displayTextArea: false, title: "Year", type: ControlType.String }, onhaGa7eomaChange: { changes: "haGa7eoma", type: ControlType.ChangeHandler }, iiHNY3XXA: { __defaultAssetReference: "data:framer/asset-reference,aNRedHzt0bx1CtGCsWmQ8Jz8IEA.png?originalFilename=Image%2823%29.png&width=1684&height=1680", title: "Image", type: ControlType.ResponsiveImage }, dT_K6ZFq1: { defaultValue: "Executive Office Workspace", displayTextArea: true, title: "Title", type: ControlType.String }, ondT_K6ZFq1Change: { changes: "dT_K6ZFq1", type: ControlType.ChangeHandler }, n6hjgFBgX: { defaultValue: "24px 24px 32px 24px", title: "Padding", type: ControlType.Padding } });
addFonts(FramercAxo1DRKN, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "/fonts/Inter-Regular.woff2", weight: "400" }] }, ...getFontsFromSharedStyle(fonts2), ...getFontsFromSharedStyle(fonts)], { supportsExplicitInterCodegen: true });
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "FramercAxo1DRKN", "slots": [], "annotations": { "framerImmutableVariables": "true", "framerAutoSizeImages": "true", "framerColorSyntax": "true", "framerContractVersion": "1", "framerDisplayContentsDiv": "false", "framerComponentViewportWidth": "true", "framerIntrinsicWidth": "426", "framerVariables": '{"IienP9oz0":"location","haGa7eoma":"year","iiHNY3XXA":"image","dT_K6ZFq1":"title","n6hjgFBgX":"padding"}', "framerIntrinsicHeight": "735", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","auto"]},"JHFWi4Fq0":{"layout":["fixed","auto"]},"NgExSWWyu":{"layout":["fixed","auto"]},"jd2mym9vh":{"layout":["fixed","auto"]}}}' } }, "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  cAxo1DRKN_default as default
};
