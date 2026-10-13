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

// http-url:https://framerusercontent.com/modules/kwzFPkYycDlcYVa8Jo8z/7fzsVBDb36pqmEqmPFT6/MnBFpvDZb.js
import { jsx as _jsx3, jsxs as _jsxs3 } from "react/jsx-runtime";
import { addFonts as addFonts3, addPropertyControls as addPropertyControls3, ComponentViewportProvider as ComponentViewportProvider2, ControlType as ControlType3, cx as cx3, forwardLoader as forwardLoader2, getFonts as getFonts2, SmartComponentScopedContainer as SmartComponentScopedContainer2, useActiveVariantCallback as useActiveVariantCallback2, useComponentViewport as useComponentViewport3, useLocaleInfo as useLocaleInfo3, useVariantState as useVariantState3, withCSS as withCSS3, withFX } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup3, motion as motion3, MotionConfigContext as MotionConfigContext3 } from "framer-motion";
import * as React3 from "react";
import { useRef as useRef3 } from "react";

// http-url:https://framerusercontent.com/modules/TLOS3wvDHp7bH45Bv9uK/Cjiy4rw7qGwfRTLHBVZ7/BVN3LZaGg.js
import { jsx as _jsx2, jsxs as _jsxs2 } from "react/jsx-runtime";
import { addFonts as addFonts2, addPropertyControls as addPropertyControls2, ComponentViewportProvider, ControlType as ControlType2, cx as cx2, forwardLoader, getFonts, getFontsFromSharedStyle, RichText, SmartComponentScopedContainer, useActiveVariantCallback, useComponentViewport as useComponentViewport2, useLocaleInfo as useLocaleInfo2, useVariantState as useVariantState2, withCSS as withCSS2 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup2, motion as motion2, MotionConfigContext as MotionConfigContext2 } from "framer-motion";
import * as React2 from "react";
import { useRef as useRef2 } from "react";

// http-url:https://framerusercontent.com/modules/UEw1Ml1OZXNJ7pukESfa/3LUpGTA4EM3gxkg21fSX/NAlnYZwzB.js
import { fontStore } from "./_framer-runtime.js";
fontStore.loadFonts(["GF;Geist-regular", "GF;Geist-700", "GF;Geist-700italic", "GF;Geist-italic"]);
var fonts = [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "400" }, { cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "700" }, { cssFamilyName: "Geist", source: "google", style: "italic", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "700" }, { cssFamilyName: "Geist", source: "google", style: "italic", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "400" }] }];
var css = ['.framer-K4WzA .framer-styles-preset-117cc1q:not(.rich-text-wrapper), .framer-K4WzA .framer-styles-preset-117cc1q.rich-text-wrapper p { --framer-font-family: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 16px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 400; --framer-font-weight-bold: 700; --framer-font-weight-bold-italic: 700; --framer-font-weight-italic: 400; --framer-letter-spacing: 0px; --framer-line-height: 1.5em; --framer-paragraph-spacing: 20px; --framer-text-alignment: start; --framer-text-color: var(--token-05f1db4d-8688-46b3-bf5f-b74ebb2a836f, #666666); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }'];
var className = "framer-K4WzA";

// http-url:https://framerusercontent.com/modules/LjCByAr3Ho1TiYO71866/MYhO82DptPZvwc4WX0TA/Vzil4J3i1.js
import { fontStore as fontStore2 } from "./_framer-runtime.js";
fontStore2.loadFonts(["GF;Geist-500", "GF;Geist-700", "GF;Geist-700italic", "GF;Geist-500italic"]);
var fonts2 = [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "500" }, { cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "700" }, { cssFamilyName: "Geist", source: "google", style: "italic", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "700" }, { cssFamilyName: "Geist", source: "google", style: "italic", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "500" }] }];
var css2 = ['.framer-aJYlG .framer-styles-preset-w7n75z:not(.rich-text-wrapper), .framer-aJYlG .framer-styles-preset-w7n75z.rich-text-wrapper p { --framer-font-family: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 20px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 500; --framer-font-weight-bold: 700; --framer-font-weight-bold-italic: 700; --framer-font-weight-italic: 500; --framer-letter-spacing: 0px; --framer-line-height: 1.4em; --framer-paragraph-spacing: 20px; --framer-text-alignment: start; --framer-text-color: var(--token-ac0c662b-4250-4586-9bed-0f686bea2a4e, #b3b3b3); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }'];
var className2 = "framer-aJYlG";

// http-url:https://framerusercontent.com/modules/IlDHjsKaZK1wJ9LEqeOo/dLDvlBXIKK4snnZHBSVp/N68iLKzor.js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { addFonts, addPropertyControls, ControlType, cx, useComponentViewport, useLocaleInfo, useVariantState, withCSS } from "./_framer-runtime.js";
import { LayoutGroup, motion, MotionConfigContext } from "framer-motion";
import * as React from "react";
import { useRef } from "react";
var cycleOrder = ["F7pGXFseT", "GdDgTNXo6"];
var serializationHash = "framer-viWfk";
var variantClassNames = { F7pGXFseT: "framer-v-1gk3uty", GdDgTNXo6: "framer-v-gldpyg" };
function addPropertyOverrides(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition1 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition = ({ value, children }) => {
  const config = React.useContext(MotionConfigContext);
  const transition = value ?? config.transition;
  const contextValue = React.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx(MotionConfigContext.Provider, { value: contextValue, children });
};
var humanReadableVariantMap = { Minus: "GdDgTNXo6", Plus: "F7pGXFseT" };
var Variants = motion.create(React.Fragment);
var getProps = ({ height, id, width, ...props }) => {
  return { ...props, variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "F7pGXFseT" };
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
  const { style, className: className3, layoutId, variant, ...restProps } = getProps(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ cycleOrder, defaultVariant: "F7pGXFseT", ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const sharedStyleClassNames = [];
  const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx(Transition, { value: transition1, children: /* @__PURE__ */ _jsxs(motion.div, { ...restProps, ...gestureHandlers, className: cx(scopingClassNames, "framer-1gk3uty", className3, classNames), "data-framer-name": "Plus", layoutDependency, layoutId: "FAQTab__F7pGXFseT", ref: refBinding, style: { ...style }, ...addPropertyOverrides({ GdDgTNXo6: { "data-framer-name": "Minus" } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx(motion.div, { className: "framer-1eq25mo", layoutDependency, layoutId: "FAQTab__UHwpIedPt", style: { backgroundColor: "var(--token-7cc43143-e5c7-467f-8763-76424c3834ea, rgb(255, 255, 255))", borderBottomLeftRadius: 2, borderBottomRightRadius: 2, borderTopLeftRadius: 2, borderTopRightRadius: 2, rotate: 0 }, variants: { GdDgTNXo6: { rotate: 90 } } }), /* @__PURE__ */ _jsx(motion.div, { className: "framer-1gd4uwv", layoutDependency, layoutId: "FAQTab__aDkcCice6", style: { backgroundColor: "var(--token-7cc43143-e5c7-467f-8763-76424c3834ea, rgb(255, 255, 255))", borderBottomLeftRadius: 2, borderBottomRightRadius: 2, borderTopLeftRadius: 2, borderTopRightRadius: 2, opacity: 1, rotate: 90, scale: 1 }, variants: { GdDgTNXo6: { opacity: 0, rotate: 0, scale: 0 } } })] }) }) }) });
});
var css3 = [".framer-viWfk.framer-1pcsj3k, .framer-viWfk .framer-1pcsj3k { display: block; }", ".framer-viWfk.framer-1gk3uty { align-content: center; align-items: center; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: auto; justify-content: center; overflow: hidden; padding: 2px; position: relative; width: 100%; }", ".framer-viWfk .framer-1eq25mo { flex: 1 0 0px; height: 1px; overflow: hidden; position: relative; width: 2px; will-change: var(--framer-will-change-override, transform); }", ".framer-viWfk .framer-1gd4uwv { bottom: 2px; flex: none; left: calc(50.00000000000002% - 2px / 2); overflow: hidden; position: absolute; top: 2px; width: 2px; will-change: var(--framer-will-change-override, transform); z-index: 1; }"];
var FramerN68iLKzor = withCSS(Component, css3, "framer-viWfk");
var N68iLKzor_default = FramerN68iLKzor;
FramerN68iLKzor.displayName = "Icon";
FramerN68iLKzor.defaultProps = { height: 16, width: 16 };
addPropertyControls(FramerN68iLKzor, { variant: { options: ["F7pGXFseT", "GdDgTNXo6"], optionTitles: ["Plus", "Minus"], title: "Variant", type: ControlType.Enum } });
addFonts(FramerN68iLKzor, [{ explicitInter: true, fonts: [] }], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/TLOS3wvDHp7bH45Bv9uK/Cjiy4rw7qGwfRTLHBVZ7/BVN3LZaGg.js
var IconFonts = getFonts(N68iLKzor_default);
var cycleOrder2 = ["bhmm0TBLN", "RxTzXmMpB"];
var serializationHash2 = "framer-OzBqV";
var variantClassNames2 = { bhmm0TBLN: "framer-v-t9wybn", RxTzXmMpB: "framer-v-vewbzt" };
function addPropertyOverrides2(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition12 = { delay: 0, duration: 0.4, ease: [0.44, 0, 0.56, 1], type: "tween" };
var matchVariant = (...args) => {
  for (const arg of args) {
    if (arg && typeof arg === "string")
      return arg;
  }
  return void 0;
};
var Transition2 = ({ value, children }) => {
  const config = React2.useContext(MotionConfigContext2);
  const transition = value ?? config.transition;
  const contextValue = React2.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx2(MotionConfigContext2.Provider, { value: contextValue, children });
};
var humanReadableVariantMap2 = { Active: "bhmm0TBLN", Deafault: "RxTzXmMpB" };
var Variants2 = motion2.create(React2.Fragment);
var getProps2 = ({ answer, click, height, id, questions, width, ...props }) => {
  return { ...props, BcqLTKaop: answer ?? props.BcqLTKaop ?? "We begin with a consultation to understand your vision, requirements, timeline, & budget before developing a tailored design strategy with complete clarity and confidence. ", mHxad0pP3: click ?? props.mHxad0pP3, mXp12a6HI: questions ?? props.mXp12a6HI ?? "How does the design process begin?", variant: humanReadableVariantMap2[props.variant] ?? props.variant ?? "bhmm0TBLN" };
};
var createLayoutDependency2 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component2 = /* @__PURE__ */ React2.forwardRef(function(props, ref) {
  const fallbackRef = useRef2(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React2.useId();
  const { activeLocale, setLocale } = useLocaleInfo2();
  const componentViewport = useComponentViewport2();
  const { style, className: className3, layoutId, variant, mHxad0pP3, mXp12a6HI, BcqLTKaop, ...restProps } = getProps2(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState2({ cycleOrder: cycleOrder2, defaultVariant: "bhmm0TBLN", ref: refBinding, variant, variantClassNames: variantClassNames2 });
  const layoutDependency = createLayoutDependency2(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback(baseVariant);
  const onTapd6ybi8 = activeVariantCallback(async (...args) => {
    setGestureState({ isPressed: false });
    if (mHxad0pP3) {
      const res = await mHxad0pP3(...args);
      if (res === false)
        return false;
    }
    setVariant("RxTzXmMpB");
  });
  const onTaps5hwng = activeVariantCallback(async (...args) => {
    setGestureState({ isPressed: false });
    if (mHxad0pP3) {
      const res = await mHxad0pP3(...args);
      if (res === false)
        return false;
    }
    setVariant("bhmm0TBLN");
  });
  const onTap1vzlqwp = activeVariantCallback(async (...args) => {
    setVariant("RxTzXmMpB");
  });
  const onTap14d1ucy = activeVariantCallback(async (...args) => {
    setVariant("bhmm0TBLN");
  });
  const sharedStyleClassNames = [className2, className];
  const scopingClassNames = cx2(serializationHash2, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (baseVariant === "RxTzXmMpB")
      return false;
    return true;
  };
  return /* @__PURE__ */ _jsx2(LayoutGroup2, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx2(Variants2, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx2(Transition2, { value: transition12, children: /* @__PURE__ */ _jsxs2(motion2.div, { ...restProps, ...gestureHandlers, className: cx2(scopingClassNames, "framer-t9wybn", className3, classNames), "data-framer-name": "Active", "data-highlight": true, layoutDependency, layoutId: "FAQTab__bhmm0TBLN", onTap: onTapd6ybi8, ref: refBinding, style: { backgroundColor: "var(--token-7cc43143-e5c7-467f-8763-76424c3834ea, rgb(255, 255, 255))", borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8, ...style }, ...addPropertyOverrides2({ RxTzXmMpB: { "data-framer-name": "Deafault", onTap: onTaps5hwng } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsxs2(motion2.div, { className: "framer-x92l8j", "data-framer-name": "Questions", layoutDependency, layoutId: "FAQTab__T2EnN9516", children: [/* @__PURE__ */ _jsx2(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx2(React2.Fragment, { children: /* @__PURE__ */ _jsx2(motion2.p, { className: "framer-styles-preset-w7n75z", "data-styles-preset": "Vzil4J3i1", dir: "auto", style: { "--framer-text-color": "var(--extracted-r6o4lv, var(--token-88eff137-1274-4a36-b366-ef51c420159a, rgb(0, 0, 0)))" }, children: "How does the design process begin?" }) }), className: "framer-1nngylq", "data-framer-name": "How does the design process begin?", fonts: ["Inter"], layoutDependency, layoutId: "FAQTab__OdZnBlneO", style: { "--extracted-r6o4lv": "var(--token-88eff137-1274-4a36-b366-ef51c420159a, rgb(0, 0, 0))", "--framer-paragraph-spacing": "0px" }, text: mXp12a6HI, verticalAlignment: "top", withExternalLayout: true }), /* @__PURE__ */ _jsx2(motion2.div, { className: "framer-1b8bs4l", "data-framer-name": "Icon Wrap", "data-highlight": true, layoutDependency, layoutId: "FAQTab__AHLivwNPT", onTap: onTap1vzlqwp, style: { backgroundColor: "var(--token-88eff137-1274-4a36-b366-ef51c420159a, rgb(0, 0, 0))", borderBottomLeftRadius: 100, borderBottomRightRadius: 100, borderTopLeftRadius: 100, borderTopRightRadius: 100 }, ...addPropertyOverrides2({ RxTzXmMpB: { onTap: onTap14d1ucy } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx2(ComponentViewportProvider, { height: 16, width: "16px", y: (componentViewport?.y || 0) + 24 + 0 + 0 + 4, children: /* @__PURE__ */ _jsx2(SmartComponentScopedContainer, { className: "framer-1gncj8x-container", layoutDependency, layoutId: "FAQTab__IyMjiZ2sO-container", nodeId: "IyMjiZ2sO", rendersWithMotion: true, scopeId: "BVN3LZaGg", children: /* @__PURE__ */ _jsx2(N68iLKzor_default, { height: "100%", id: "IyMjiZ2sO", layoutId: "FAQTab__IyMjiZ2sO", style: { height: "100%", width: "100%" }, variant: matchVariant("GdDgTNXo6"), width: "100%", ...addPropertyOverrides2({ RxTzXmMpB: { variant: matchVariant("F7pGXFseT") } }, baseVariant, gestureVariant) }) }) }) })] }), isDisplayed() && /* @__PURE__ */ _jsx2(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx2(React2.Fragment, { children: /* @__PURE__ */ _jsx2(motion2.p, { className: "framer-styles-preset-117cc1q", "data-styles-preset": "NAlnYZwzB", dir: "auto", children: "We begin with a consultation to understand your vision, requirements, timeline, & budget before developing a tailored design strategy with complete clarity and confidence. " }) }), className: "framer-1exk3fq", "data-framer-name": "We begin with a consultation to understand your vision, requirements, timeline, & budget before developing a tailored design strategy with complete clarity and confidence.", fonts: ["Inter"], layoutDependency, layoutId: "FAQTab__bgvozkk5b", style: { "--framer-paragraph-spacing": "0px" }, text: BcqLTKaop, verticalAlignment: "top", withExternalLayout: true })] }) }) }) });
});
var css4 = [".framer-OzBqV.framer-1fo2tgg, .framer-OzBqV .framer-1fo2tgg { display: block; }", ".framer-OzBqV.framer-t9wybn { align-content: flex-start; align-items: flex-start; cursor: pointer; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 24px; height: min-content; justify-content: flex-start; overflow: hidden; padding: 24px; position: relative; width: 100%; will-change: var(--framer-will-change-override, transform); }", ".framer-OzBqV .framer-x92l8j { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 24px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-OzBqV .framer-1nngylq { flex: 1 0 0px; height: auto; position: relative; white-space: pre-wrap; width: 1px; word-break: break-word; word-wrap: break-word; }", ".framer-OzBqV .framer-1b8bs4l { align-content: center; align-items: center; cursor: pointer; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 4px; position: relative; width: min-content; will-change: var(--framer-will-change-override, transform); }", ".framer-OzBqV .framer-1gncj8x-container { flex: none; height: 16px; position: relative; width: 16px; }", ".framer-OzBqV .framer-1exk3fq { flex: none; height: auto; position: relative; white-space: pre-wrap; width: 100%; word-break: break-word; word-wrap: break-word; }", ...css2, ...css];
var FramerBVN3LZaGg = withCSS2(Component2, css4, "framer-OzBqV");
var BVN3LZaGg_default = FramerBVN3LZaGg;
FramerBVN3LZaGg.displayName = "FAQ";
FramerBVN3LZaGg.defaultProps = { height: 148, width: 820 };
addPropertyControls2(FramerBVN3LZaGg, { variant: { options: ["bhmm0TBLN", "RxTzXmMpB"], optionTitles: ["Active", "Deafault"], title: "Variant", type: ControlType2.Enum }, mHxad0pP3: { title: "Click", type: ControlType2.EventHandler }, mXp12a6HI: { defaultValue: "How does the design process begin?", displayTextArea: true, title: "Questions", type: ControlType2.String }, onmXp12a6HIChange: { changes: "mXp12a6HI", type: ControlType2.ChangeHandler }, BcqLTKaop: { defaultValue: "We begin with a consultation to understand your vision, requirements, timeline, & budget before developing a tailored design strategy with complete clarity and confidence. ", displayTextArea: true, title: "Answer", type: ControlType2.String }, onBcqLTKaopChange: { changes: "BcqLTKaop", type: ControlType2.ChangeHandler } });
addFonts2(FramerBVN3LZaGg, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "/fonts/Inter-Regular.woff2", weight: "400" }] }, ...IconFonts, ...getFontsFromSharedStyle(fonts2), ...getFontsFromSharedStyle(fonts)], { supportsExplicitInterCodegen: true });
FramerBVN3LZaGg.loader = { load: (props, context) => {
  const locale = context.locale;
  return Promise.allSettled([forwardLoader(N68iLKzor_default, {}, context)]);
} };

// http-url:https://framerusercontent.com/modules/kwzFPkYycDlcYVa8Jo8z/7fzsVBDb36pqmEqmPFT6/MnBFpvDZb.js
var FAQFonts = getFonts2(BVN3LZaGg_default);
var SmartComponentScopedContainerWithFX = withFX(SmartComponentScopedContainer2);
var cycleOrder3 = ["bf1a0cKvC", "lPv5OKSsV", "MwadYNtTK", "tj9dnPh5B", "UD0B2Nz7x", "DTTjykEMF"];
var serializationHash3 = "framer-weh80";
var variantClassNames3 = { bf1a0cKvC: "framer-v-1fzilq7", DTTjykEMF: "framer-v-1r1ox01", lPv5OKSsV: "framer-v-1ukvstn", MwadYNtTK: "framer-v-136zbu", tj9dnPh5B: "framer-v-kobiw9", UD0B2Nz7x: "framer-v-1tjgmw8" };
function addPropertyOverrides3(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition13 = { delay: 0, duration: 0.4, ease: [0.44, 0, 0.56, 1], type: "tween" };
var animation = { opacity: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, x: 0, y: 20 };
var transition2 = { delay: 0, duration: 0.5, ease: [0, 0, 1, 1], type: "tween" };
var animation1 = { opacity: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition2, x: 0, y: 20 };
var matchVariant2 = (...args) => {
  for (const arg of args) {
    if (arg && typeof arg === "string")
      return arg;
  }
  return void 0;
};
var transition3 = { delay: 0.1, duration: 0.5, ease: [0, 0, 1, 1], type: "tween" };
var animation2 = { opacity: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition3, x: 0, y: 20 };
var transition4 = { delay: 0.2, duration: 0.5, ease: [0, 0, 1, 1], type: "tween" };
var animation3 = { opacity: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition4, x: 0, y: 20 };
var transition5 = { delay: 0.3, duration: 0.5, ease: [0, 0, 1, 1], type: "tween" };
var animation4 = { opacity: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition5, x: 0, y: 20 };
var transition6 = { delay: 0.4, duration: 0.5, ease: [0, 0, 1, 1], type: "tween" };
var animation5 = { opacity: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition6, x: 0, y: 20 };
var transition7 = { delay: 0.5, duration: 0.5, ease: [0, 0, 1, 1], type: "tween" };
var animation6 = { opacity: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition7, x: 0, y: 20 };
var Transition3 = ({ value, children }) => {
  const config = React3.useContext(MotionConfigContext3);
  const transition = value ?? config.transition;
  const contextValue = React3.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx3(MotionConfigContext3.Provider, { value: contextValue, children });
};
var humanReadableVariantMap3 = { "Variant 1": "bf1a0cKvC", "Variant 2": "lPv5OKSsV", "Variant 3": "MwadYNtTK", "Variant 4": "tj9dnPh5B", "Variant 5": "UD0B2Nz7x", "Variant 6": "DTTjykEMF" };
var Variants3 = motion3.create(React3.Fragment);
var getProps3 = ({ height, id, width, ...props }) => {
  return { ...props, variant: humanReadableVariantMap3[props.variant] ?? props.variant ?? "bf1a0cKvC" };
};
var createLayoutDependency3 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component3 = /* @__PURE__ */ React3.forwardRef(function(props, ref) {
  const fallbackRef = useRef3(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React3.useId();
  const { activeLocale, setLocale } = useLocaleInfo3();
  const componentViewport = useComponentViewport3();
  const { style, className: className3, layoutId, variant, ...restProps } = getProps3(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState3({ cycleOrder: cycleOrder3, defaultVariant: "bf1a0cKvC", ref: refBinding, variant, variantClassNames: variantClassNames3 });
  const layoutDependency = createLayoutDependency3(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback2(baseVariant);
  const mHxad0pP3133k51u = activeVariantCallback(async (...args) => {
    setVariant("bf1a0cKvC");
  });
  const mHxad0pP31t201wj = activeVariantCallback(async (...args) => {
    setVariant("lPv5OKSsV");
  });
  const mHxad0pP31nm002g = activeVariantCallback(async (...args) => {
    setVariant("MwadYNtTK");
  });
  const mHxad0pP34f0tup = activeVariantCallback(async (...args) => {
    setVariant("tj9dnPh5B");
  });
  const mHxad0pP31a1vs2p = activeVariantCallback(async (...args) => {
    setVariant("UD0B2Nz7x");
  });
  const mHxad0pP31854u9l = activeVariantCallback(async (...args) => {
    setVariant("DTTjykEMF");
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx3(serializationHash3, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx3(LayoutGroup3, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx3(Variants3, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx3(Transition3, { value: transition13, children: /* @__PURE__ */ _jsxs3(motion3.div, { ...restProps, ...gestureHandlers, className: cx3(scopingClassNames, "framer-1fzilq7", className3, classNames), "data-framer-name": "Variant 1", layoutDependency, layoutId: "FAQTab__bf1a0cKvC", ref: refBinding, style: { ...style }, ...addPropertyOverrides3({ DTTjykEMF: { "data-framer-name": "Variant 6" }, lPv5OKSsV: { "data-framer-name": "Variant 2" }, MwadYNtTK: { "data-framer-name": "Variant 3" }, tj9dnPh5B: { "data-framer-name": "Variant 4" }, UD0B2Nz7x: { "data-framer-name": "Variant 5" } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx3(ComponentViewportProvider2, { height: 148, width: componentViewport?.width || "100vw", y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 568) - 0 - 928) / 2 + 0 + 0), ...addPropertyOverrides3({ DTTjykEMF: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 0 + 0) }, MwadYNtTK: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 0 + 0) }, tj9dnPh5B: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 0 + 0) }, UD0B2Nz7x: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 0 + 0) } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx3(SmartComponentScopedContainerWithFX, { __framer__animate: { transition: transition2 }, __framer__animateOnce: true, __framer__enter: animation, __framer__exit: animation1, __framer__styleAppearEffectEnabled: true, __framer__threshold: 0.5, __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, className: "framer-1397sen-container", layoutDependency, layoutId: "FAQTab__UUTmJtODR-container", nodeId: "UUTmJtODR", rendersWithMotion: true, scopeId: "MnBFpvDZb", children: /* @__PURE__ */ _jsx3(BVN3LZaGg_default, { BcqLTKaop: "We begin with a consultation to understand your vision, requirements, timeline, & budget before developing a tailored design strategy with complete clarity and confidence. ", height: "100%", id: "UUTmJtODR", layoutId: "FAQTab__UUTmJtODR", mHxad0pP3: mHxad0pP3133k51u, mXp12a6HI: "How does the design process begin?", style: { width: "100%" }, variant: matchVariant2("bhmm0TBLN"), width: "100%", ...addPropertyOverrides3({ DTTjykEMF: { variant: matchVariant2("RxTzXmMpB") }, lPv5OKSsV: { variant: matchVariant2("RxTzXmMpB") }, MwadYNtTK: { variant: matchVariant2("RxTzXmMpB") }, tj9dnPh5B: { variant: matchVariant2("RxTzXmMpB") }, UD0B2Nz7x: { variant: matchVariant2("RxTzXmMpB") } }, baseVariant, gestureVariant) }) }) }), /* @__PURE__ */ _jsx3(ComponentViewportProvider2, { height: 148, width: componentViewport?.width || "100vw", y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 568) - 0 - 928) / 2 + 148 + 8), ...addPropertyOverrides3({ DTTjykEMF: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 148 + 8) }, MwadYNtTK: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 148 + 8) }, tj9dnPh5B: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 148 + 8) }, UD0B2Nz7x: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 148 + 8) } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx3(SmartComponentScopedContainerWithFX, { __framer__animate: { transition: transition3 }, __framer__animateOnce: true, __framer__enter: animation, __framer__exit: animation2, __framer__styleAppearEffectEnabled: true, __framer__threshold: 0.5, __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, className: "framer-1uxlhvc-container", layoutDependency, layoutId: "FAQTab__wRbG2dBYi-container", nodeId: "wRbG2dBYi", rendersWithMotion: true, scopeId: "MnBFpvDZb", children: /* @__PURE__ */ _jsx3(BVN3LZaGg_default, { BcqLTKaop: "Yes, we craft tailored interior solutions for luxury homes, modern offices, & retail spaces, ensuring every environment perfectly reflects your lifestyle or brand identity.", height: "100%", id: "wRbG2dBYi", layoutId: "FAQTab__wRbG2dBYi", mHxad0pP3: mHxad0pP31t201wj, mXp12a6HI: "Do you handle both residential and commercial projects?", style: { width: "100%" }, variant: matchVariant2("RxTzXmMpB"), width: "100%", ...addPropertyOverrides3({ lPv5OKSsV: { variant: matchVariant2("bhmm0TBLN") } }, baseVariant, gestureVariant) }) }) }), /* @__PURE__ */ _jsx3(ComponentViewportProvider2, { height: 148, width: componentViewport?.width || "100vw", y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 568) - 0 - 928) / 2 + 296 + 16), ...addPropertyOverrides3({ DTTjykEMF: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 296 + 16) }, MwadYNtTK: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 296 + 16) }, tj9dnPh5B: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 296 + 16) }, UD0B2Nz7x: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 296 + 16) } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx3(SmartComponentScopedContainerWithFX, { __framer__animate: { transition: transition4 }, __framer__animateOnce: true, __framer__enter: animation, __framer__exit: animation3, __framer__styleAppearEffectEnabled: true, __framer__threshold: 0.5, __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, className: "framer-17vhpkl-container", layoutDependency, layoutId: "FAQTab__o33CFjbPE-container", nodeId: "o33CFjbPE", rendersWithMotion: true, scopeId: "MnBFpvDZb", children: /* @__PURE__ */ _jsx3(BVN3LZaGg_default, { BcqLTKaop: "We seamlessly integrate your cherished pieces into the new layout, refining finishes and decor to create a harmonious blend of familiar comfort and modern aesthetics.", height: "100%", id: "o33CFjbPE", layoutId: "FAQTab__o33CFjbPE", mHxad0pP3: mHxad0pP31nm002g, mXp12a6HI: "Can you work with my existing furniture?", style: { width: "100%" }, variant: matchVariant2("RxTzXmMpB"), width: "100%", ...addPropertyOverrides3({ MwadYNtTK: { variant: matchVariant2("bhmm0TBLN") } }, baseVariant, gestureVariant) }) }) }), /* @__PURE__ */ _jsx3(ComponentViewportProvider2, { height: 148, width: componentViewport?.width || "100vw", y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 568) - 0 - 928) / 2 + 444 + 24), ...addPropertyOverrides3({ DTTjykEMF: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 444 + 24) }, MwadYNtTK: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 444 + 24) }, tj9dnPh5B: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 444 + 24) }, UD0B2Nz7x: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 444 + 24) } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx3(SmartComponentScopedContainerWithFX, { __framer__animate: { transition: transition5 }, __framer__animateOnce: true, __framer__enter: animation, __framer__exit: animation4, __framer__styleAppearEffectEnabled: true, __framer__threshold: 0.5, __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, className: "framer-1nxhf8p-container", layoutDependency, layoutId: "FAQTab__EDRvVZSK7-container", nodeId: "EDRvVZSK7", rendersWithMotion: true, scopeId: "MnBFpvDZb", children: /* @__PURE__ */ _jsx3(BVN3LZaGg_default, { BcqLTKaop: "Project timelines range from 4 to 12 weeks based on scope, custom design requirements, and procurement, ensuring smooth execution without compromising on quality.", height: "100%", id: "EDRvVZSK7", layoutId: "FAQTab__EDRvVZSK7", mHxad0pP3: mHxad0pP34f0tup, mXp12a6HI: "How long does a typical project take?", style: { width: "100%" }, variant: matchVariant2("RxTzXmMpB"), width: "100%", ...addPropertyOverrides3({ tj9dnPh5B: { variant: matchVariant2("bhmm0TBLN") } }, baseVariant, gestureVariant) }) }) }), /* @__PURE__ */ _jsx3(ComponentViewportProvider2, { height: 148, width: componentViewport?.width || "100vw", y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 568) - 0 - 928) / 2 + 592 + 32), ...addPropertyOverrides3({ DTTjykEMF: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 592 + 32) }, MwadYNtTK: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 592 + 32) }, tj9dnPh5B: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 592 + 32) }, UD0B2Nz7x: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 592 + 32) } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx3(SmartComponentScopedContainerWithFX, { __framer__animate: { transition: transition6 }, __framer__animateOnce: true, __framer__enter: animation, __framer__exit: animation5, __framer__styleAppearEffectEnabled: true, __framer__threshold: 0.5, __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, className: "framer-qps9b1-container", layoutDependency, layoutId: "FAQTab__Um3jMV7wA-container", nodeId: "Um3jMV7wA", rendersWithMotion: true, scopeId: "MnBFpvDZb", children: /* @__PURE__ */ _jsx3(BVN3LZaGg_default, { BcqLTKaop: "We create realistic 3D renderings and spatial layouts before execution, allowing you to visualize textures, lighting, and materials with complete detail and confidence.", height: "100%", id: "Um3jMV7wA", layoutId: "FAQTab__Um3jMV7wA", mHxad0pP3: mHxad0pP31a1vs2p, mXp12a6HI: "Do you provide 3D visualizations?", style: { width: "100%" }, variant: matchVariant2("RxTzXmMpB"), width: "100%", ...addPropertyOverrides3({ UD0B2Nz7x: { variant: matchVariant2("bhmm0TBLN") } }, baseVariant, gestureVariant) }) }) }), /* @__PURE__ */ _jsx3(ComponentViewportProvider2, { height: 148, width: componentViewport?.width || "100vw", y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 568) - 0 - 928) / 2 + 740 + 40), ...addPropertyOverrides3({ DTTjykEMF: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 740 + 40) }, MwadYNtTK: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 740 + 40) }, tj9dnPh5B: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 740 + 40) }, UD0B2Nz7x: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 200) - 0 - 928) / 2 + 740 + 40) } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx3(SmartComponentScopedContainerWithFX, { __framer__animate: { transition: transition7 }, __framer__animateOnce: true, __framer__enter: animation, __framer__exit: animation6, __framer__styleAppearEffectEnabled: true, __framer__threshold: 0.5, __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, className: "framer-xzf1ho-container", layoutDependency, layoutId: "FAQTab__zaf9LXhz4-container", nodeId: "zaf9LXhz4", rendersWithMotion: true, scopeId: "MnBFpvDZb", children: /* @__PURE__ */ _jsx3(BVN3LZaGg_default, { BcqLTKaop: "We offer full turnkey management, handling contractor oversight, material sourcing, and site supervision to deliver your project stress-free, on time, and within budget.", height: "100%", id: "zaf9LXhz4", layoutId: "FAQTab__zaf9LXhz4", mHxad0pP3: mHxad0pP31854u9l, mXp12a6HI: "Can you manage the entire project?", style: { width: "100%" }, variant: matchVariant2("RxTzXmMpB"), width: "100%", ...addPropertyOverrides3({ DTTjykEMF: { variant: matchVariant2("bhmm0TBLN") } }, baseVariant, gestureVariant) }) }) })] }) }) }) });
});
var css5 = [".framer-weh80.framer-8l6cn9, .framer-weh80 .framer-8l6cn9 { display: block; }", ".framer-weh80.framer-1fzilq7 { align-content: center; align-items: center; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 8px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; }", ".framer-weh80 .framer-1397sen-container, .framer-weh80 .framer-1uxlhvc-container, .framer-weh80 .framer-17vhpkl-container, .framer-weh80 .framer-1nxhf8p-container, .framer-weh80 .framer-qps9b1-container, .framer-weh80 .framer-xzf1ho-container { flex: none; height: auto; position: relative; width: 100%; }"];
var FramerMnBFpvDZb = withCSS3(Component3, css5, "framer-weh80");
var MnBFpvDZb_default = FramerMnBFpvDZb;
FramerMnBFpvDZb.displayName = "FAQ Tab";
FramerMnBFpvDZb.defaultProps = { height: 568, width: 820 };
addPropertyControls3(FramerMnBFpvDZb, { variant: { options: ["bf1a0cKvC", "lPv5OKSsV", "MwadYNtTK", "tj9dnPh5B", "UD0B2Nz7x", "DTTjykEMF"], optionTitles: ["Variant 1", "Variant 2", "Variant 3", "Variant 4", "Variant 5", "Variant 6"], title: "Variant", type: ControlType3.Enum } });
addFonts3(FramerMnBFpvDZb, [{ explicitInter: true, fonts: [] }, ...FAQFonts], { supportsExplicitInterCodegen: true });
FramerMnBFpvDZb.loader = { load: (props, context) => {
  const locale = context.locale;
  return Promise.allSettled([forwardLoader2(BVN3LZaGg_default, {}, context)]);
} };
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "FramerMnBFpvDZb", "slots": [], "annotations": { "framerDisplayContentsDiv": "false", "framerColorSyntax": "true", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","auto"]},"lPv5OKSsV":{"layout":["fixed","auto"]},"MwadYNtTK":{"layout":["fixed","auto"]},"tj9dnPh5B":{"layout":["fixed","auto"]},"UD0B2Nz7x":{"layout":["fixed","auto"]},"DTTjykEMF":{"layout":["fixed","auto"]}}}', "framerAutoSizeImages": "true", "framerIntrinsicHeight": "568", "framerContractVersion": "1", "framerImmutableVariables": "true", "framerComponentViewportWidth": "true", "framerIntrinsicWidth": "820" } }, "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  MnBFpvDZb_default as default
};
