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

// http-url:https://framerusercontent.com/modules/srPbYSA6YrG49ETwnelg/ECbwUJjhH1a6shApFRc3/D6hGfwxQc.js
import { jsx as _jsx, jsxs as _jsxs2 } from "react/jsx-runtime";
import { addFonts, addPropertyControls as addPropertyControls2, ComponentViewportProvider, ControlType as ControlType2, cx, getFonts, getFontsFromSharedStyle, RichText, SmartComponentScopedContainer, useComponentViewport, useLocaleInfo, useVariantState, withCSS } from "./_framer-runtime.js";
import { LayoutGroup, motion as motion2, MotionConfigContext } from "framer-motion";
import * as React from "react";
import { useRef as useRef2 } from "react";

// http-url:https://framerusercontent.com/modules/qpjhCcDm4G1NbFAlpMKV/OnyZiTlIjOBuSKcKQWFv/AnimatedNumberCounter_Prod.js
import { jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { addPropertyControls, ControlType, RenderTarget } from "./_framer-runtime.js";
import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, animate, useInView } from "framer-motion";
function AnimatedNumberCounter(props) {
  const { mode, start, end, value, decimals, commas, color, animation } = props;
  const isCanvas = RenderTarget.current() === RenderTarget.canvas;
  const Tag = props.tag;
  const MotionTag = motion[props.tag];
  const isDefault = mode == "default";
  const initialValue = isDefault ? start : value;
  const transition = isDefault ? animation.transition : props.transition;
  const formatNumber = (number2) => {
    let numberString = number2.toFixed(decimals);
    if (commas) {
      numberString = numberString.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return numberString;
  };
  const [number, setNumber] = useState(initialValue);
  const [finalValue, setFinalValue] = useState(number);
  const [currentAnimation, setCurrentAnimation] = useState(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: !props.animation.replay, amount: "some" });
  const motionValue = useMotionValue(value);
  const runAnimation = (from, to) => {
    if (!isCanvas) {
      if (currentAnimation) {
        currentAnimation.stop();
      }
      setFinalValue(to);
      setCurrentAnimation(animate(from, to, { ...transition, onUpdate: (latest) => {
        setNumber(latest);
      } }));
    }
  };
  useEffect(() => {
    if (isDefault && animation.trigger == "appear") {
      runAnimation(start, end);
    }
  }, []);
  useEffect(() => {
    if (isDefault && animation.trigger == "layerInView") {
      if (isInView) {
        runAnimation(start, end);
      } else {
        if (currentAnimation) {
          currentAnimation.stop();
        }
        setNumber(start);
      }
    }
  }, [isInView]);
  useEffect(() => {
    if (!isDefault) {
      runAnimation(number, value);
    }
  }, [value]);
  return /* @__PURE__ */ _jsxs(_Fragment, { children: [/* @__PURE__ */ _jsxs(Tag, { style: { ...props.style, margin: 0, opacity: 0, pointerEvents: "none", userSelect: "none", textWrap: props.balance ? "balance" : void 0, fontVariantNumeric: props.monospace ? "tabular-nums" : void 0, textAlign: "center", ...props.font }, children: [props.prefix, formatNumber(isCanvas ? initialValue : finalValue), props.suffix] }), /* @__PURE__ */ _jsxs(MotionTag, { ref, style: { position: "absolute", inset: 0, userSelect: props.userSelect ? "auto" : "none", fontVariantNumeric: props.monospace ? "tabular-nums" : void 0, margin: 0, ...color.mode == "solid" ? { color: color.color } : { WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundImage: `linear-gradient(${color.angle}deg, ${color.startColor}, ${color.endColor})` }, textDecoration: props.decoration, textWrap: props.balance ? "balance" : void 0, textAlign: "center", ...props.font, ...props.style }, children: [props.prefix, formatNumber(isCanvas ? initialValue : number), props.suffix] })] });
}
AnimatedNumberCounter.displayName = "Animated Number Counter";
addPropertyControls(AnimatedNumberCounter, { mode: { type: ControlType.Enum, options: ["default", "variants"], optionTitles: ["Default", "Variants"], displaySegmentedControl: true }, value: { type: ControlType.Number, defaultValue: 0, hidden: (props) => props.mode !== "variants" }, start: { type: ControlType.Number, defaultValue: 0, hidden: (props) => props.mode !== "default" }, end: { type: ControlType.Number, defaultValue: 100, hidden: (props) => props.mode !== "default" }, animation: { type: ControlType.Object, icon: "effect", hidden: (props) => props.mode !== "default", controls: { trigger: { type: ControlType.Enum, defaultValue: "layerInView", options: ["appear", "layerInView"], optionTitles: ["Appear", "Layer in View"], displaySegmentedControl: true, segmentedControlDirection: "vertical" }, replay: { type: ControlType.Boolean, defaultValue: true, hidden(props) {
  return props.trigger !== "layerInView";
} }, transition: { type: ControlType.Transition, defaultValue: { type: "spring", duration: 1, bounce: 0 } } } }, transition: { type: ControlType.Transition, defaultValue: { type: "spring", duration: 1, bounce: 0 }, hidden: (props) => props.mode !== "variants" }, decimals: { type: ControlType.Enum, defaultValue: 0, options: [0, 1, 2, 3], optionTitles: ["Off", "1", "2", "3"], displaySegmentedControl: true }, commas: { type: ControlType.Boolean, defaultValue: true }, font: { type: "font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 16, lineHeight: 1 } }, color: { type: ControlType.Object, controls: { mode: { type: ControlType.Enum, defaultValue: "solid", options: ["solid", "gradient"], optionTitles: ["Solid", "Gradient"], displaySegmentedControl: true }, color: { type: ControlType.Color, defaultValue: "#000", hidden: (props) => props.mode !== "solid" }, startColor: { type: ControlType.Color, defaultValue: "#000", hidden: (props) => props.mode !== "gradient" }, endColor: { type: ControlType.Color, defaultValue: "#FFF", hidden: (props) => props.mode !== "gradient" }, angle: { type: ControlType.Number, defaultValue: 180, min: -360, max: 360, unit: "\xB0", hidden: (props) => props.mode !== "gradient" } } }, prefix: { type: ControlType.String, placeholder: "Prefix" }, suffix: { type: ControlType.String, placeholder: "Suffix" }, decoration: { type: ControlType.Enum, defaultValue: "none", options: ["none", "underline", "line-through"], optionTitles: ["None", "Underline", "Strikethrough"] }, balance: { type: ControlType.Boolean, defaultValue: false }, userSelect: { type: ControlType.Boolean, defaultValue: true }, tag: { type: ControlType.Enum, defaultValue: "p", displaySegmentedControl: true, options: ["h1", "h2", "h3", "p"], optionTitles: ["H1", "H2", "H3", "P"] }, monospace: { type: ControlType.Boolean, defaultValue: false, description: "More components at [Framer University](https://frameruni.link/cc)." } });

// http-url:https://framerusercontent.com/modules/UEw1Ml1OZXNJ7pukESfa/3LUpGTA4EM3gxkg21fSX/NAlnYZwzB.js
import { fontStore } from "./_framer-runtime.js";
fontStore.loadFonts(["GF;Geist-regular", "GF;Geist-700", "GF;Geist-700italic", "GF;Geist-italic"]);
var fonts = [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "400" }, { cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "700" }, { cssFamilyName: "Geist", source: "google", style: "italic", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "700" }, { cssFamilyName: "Geist", source: "google", style: "italic", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "400" }] }];
var css = ['.framer-K4WzA .framer-styles-preset-117cc1q:not(.rich-text-wrapper), .framer-K4WzA .framer-styles-preset-117cc1q.rich-text-wrapper p { --framer-font-family: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 16px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 400; --framer-font-weight-bold: 700; --framer-font-weight-bold-italic: 700; --framer-font-weight-italic: 400; --framer-letter-spacing: 0px; --framer-line-height: 1.5em; --framer-paragraph-spacing: 20px; --framer-text-alignment: start; --framer-text-color: var(--token-05f1db4d-8688-46b3-bf5f-b74ebb2a836f, #666666); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }'];
var className = "framer-K4WzA";

// http-url:https://framerusercontent.com/modules/KyA0S0I9fgr0Eqaf50nF/7wGyrZF5PgB53dfGp4ZA/xfa6s4nwl.js
import { fontStore as fontStore2 } from "./_framer-runtime.js";
fontStore2.loadFonts(["GF;Geist-500", "GF;Geist-700", "GF;Geist-700italic", "GF;Geist-500italic"]);
var fonts2 = [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "500" }, { cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "700" }, { cssFamilyName: "Geist", source: "google", style: "italic", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "700" }, { cssFamilyName: "Geist", source: "google", style: "italic", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "500" }] }];
var css2 = ['.framer-Larl0 .framer-styles-preset-u5aiqz:not(.rich-text-wrapper), .framer-Larl0 .framer-styles-preset-u5aiqz.rich-text-wrapper p { --framer-font-family: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 16px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 500; --framer-font-weight-bold: 700; --framer-font-weight-bold-italic: 700; --framer-font-weight-italic: 500; --framer-letter-spacing: 0px; --framer-line-height: 1.5em; --framer-paragraph-spacing: 0px; --framer-text-alignment: start; --framer-text-color: var(--token-05f1db4d-8688-46b3-bf5f-b74ebb2a836f, #666666); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }', '@media (max-width: 1439px) and (min-width: 810px) { .framer-Larl0 .framer-styles-preset-u5aiqz:not(.rich-text-wrapper), .framer-Larl0 .framer-styles-preset-u5aiqz.rich-text-wrapper p { --framer-font-family: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 14px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 500; --framer-font-weight-bold: 700; --framer-font-weight-bold-italic: 700; --framer-font-weight-italic: 500; --framer-letter-spacing: 0px; --framer-line-height: 1.5em; --framer-paragraph-spacing: 0px; --framer-text-alignment: start; --framer-text-color: var(--token-05f1db4d-8688-46b3-bf5f-b74ebb2a836f, #666666); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; } }', '@media (max-width: 809px) and (min-width: 0px) { .framer-Larl0 .framer-styles-preset-u5aiqz:not(.rich-text-wrapper), .framer-Larl0 .framer-styles-preset-u5aiqz.rich-text-wrapper p { --framer-font-family: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 12px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 500; --framer-font-weight-bold: 700; --framer-font-weight-bold-italic: 700; --framer-font-weight-italic: 500; --framer-letter-spacing: 0px; --framer-line-height: 1.5em; --framer-paragraph-spacing: 0px; --framer-text-alignment: start; --framer-text-color: var(--token-05f1db4d-8688-46b3-bf5f-b74ebb2a836f, #666666); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; } }'];
var className2 = "framer-Larl0";

// http-url:https://framerusercontent.com/modules/srPbYSA6YrG49ETwnelg/ECbwUJjhH1a6shApFRc3/D6hGfwxQc.js
var AnimatedNumberCounterFonts = getFonts(AnimatedNumberCounter);
var serializationHash = "framer-ZarM6";
var variantClassNames = { qewXaF0ev: "framer-v-12dwgjf" };
var numberToPixelString = (value) => {
  if (typeof value !== "number")
    return value;
  if (!Number.isFinite(value))
    return void 0;
  return Math.max(0, value) + "px";
};
var transition1 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition = ({ value, children }) => {
  const config = React.useContext(MotionConfigContext);
  const transition = value ?? config.transition;
  const contextValue = React.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx(MotionConfigContext.Provider, { value: contextValue, children });
};
var Variants = motion2.create(React.Fragment);
var getProps = ({ end, gap, height, id, padding, suffix, text, width, year, ...props }) => {
  return { ...props, EEz2fPdEY: suffix ?? props.EEz2fPdEY ?? "+", HdFmJIJEO: end ?? props.HdFmJIJEO ?? 12, lK1PtWKKn: gap ?? props.lK1PtWKKn ?? 216, mhn8uOEcb: text ?? props.mhn8uOEcb ?? "Delivering thoughtful interiors with precision and timeless expertise.", uGdWbhkZM: padding ?? props.uGdWbhkZM ?? "32px", vdeHRpoDE: year ?? props.vdeHRpoDE ?? "YEARS OF EXPERIENCE" };
};
var createLayoutDependency = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component = /* @__PURE__ */ React.forwardRef(function(props, ref) {
  const fallbackRef = useRef2(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React.useId();
  const { activeLocale, setLocale } = useLocaleInfo();
  const componentViewport = useComponentViewport();
  const { style, className: className3, layoutId, variant, vdeHRpoDE, HdFmJIJEO, EEz2fPdEY, mhn8uOEcb, lK1PtWKKn, uGdWbhkZM, ...restProps } = getProps(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ defaultVariant: "qewXaF0ev", ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const sharedStyleClassNames = [className2, className];
  const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx(Transition, { value: transition1, children: /* @__PURE__ */ _jsxs2(motion2.div, { ...restProps, ...gestureHandlers, className: cx(scopingClassNames, "framer-12dwgjf", className3, classNames), "data-framer-name": "Variant 1", layoutDependency, layoutId: "JourneyCard__qewXaF0ev", ref: refBinding, style: { "--1m53pry": numberToPixelString(lK1PtWKKn), "--1p91eci": numberToPixelString(uGdWbhkZM), borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8, ...style }, children: [/* @__PURE__ */ _jsxs2(motion2.div, { className: "framer-ak4y2x", "data-border": true, "data-framer-name": "Years", layoutDependency, layoutId: "JourneyCard__OsYvuefBA", style: { "--border-bottom-width": "1px", "--border-color": "rgb(244, 244, 244)", "--border-left-width": "0px", "--border-right-width": "0px", "--border-style": "solid", "--border-top-width": "0px" }, children: [/* @__PURE__ */ _jsx(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion2.p, { className: "framer-styles-preset-u5aiqz", "data-styles-preset": "xfa6s4nwl", dir: "auto", children: "YEARS OF EXPERIENCE" }) }), className: "framer-1c6ax6j", "data-framer-name": "Nav item", fonts: ["Inter"], layoutDependency, layoutId: "JourneyCard__LLxvL_xu0", style: { "--framer-paragraph-spacing": "0px" }, text: vdeHRpoDE, verticalAlignment: "top", withExternalLayout: true }), /* @__PURE__ */ _jsxs2(motion2.div, { className: "framer-ep9tpw", "data-framer-name": "Dots", layoutDependency, layoutId: "JourneyCard__HBJw4wpVU", children: [/* @__PURE__ */ _jsx(motion2.div, { className: "framer-dzkz9t", "data-framer-name": "Dot 01", layoutDependency, layoutId: "JourneyCard__FMvKzDvrn", style: { backdropFilter: "blur(6px)", backgroundColor: "rgb(242, 242, 242)", WebkitBackdropFilter: "blur(6px)" } }), /* @__PURE__ */ _jsx(motion2.div, { className: "framer-1jtd5mg", "data-framer-name": "Dot 02", layoutDependency, layoutId: "JourneyCard__uTLTOH9qs", style: { backdropFilter: "blur(6px)", backgroundColor: "rgb(242, 242, 242)", WebkitBackdropFilter: "blur(6px)" } }), /* @__PURE__ */ _jsx(motion2.div, { className: "framer-hx7ki3", "data-framer-name": "Dot 03", layoutDependency, layoutId: "JourneyCard__W9avA6ZhI", style: { backdropFilter: "blur(6px)", backgroundColor: "rgb(242, 242, 242)", WebkitBackdropFilter: "blur(6px)" } })] })] }), /* @__PURE__ */ _jsxs2(motion2.div, { className: "framer-1tyfy8z", "data-framer-name": "Counter", layoutDependency, layoutId: "JourneyCard__l2LBzvkdY", children: [/* @__PURE__ */ _jsx(ComponentViewportProvider, { children: /* @__PURE__ */ _jsx(SmartComponentScopedContainer, { className: "framer-108y1yl-container", isAuthoredByUser: true, isModuleExternal: true, layoutDependency, layoutId: "JourneyCard__VG6OpvgLy-container", nodeId: "VG6OpvgLy", rendersWithMotion: true, scopeId: "D6hGfwxQc", children: /* @__PURE__ */ _jsx(AnimatedNumberCounter, { animation: { replay: false, transition: { bounce: 0, delay: 0, duration: 2, type: "spring" }, trigger: "layerInView" }, balance: false, color: { angle: 180, color: "var(--token-88eff137-1274-4a36-b366-ef51c420159a, rgb(0, 0, 0))", endColor: "rgb(255, 255, 255)", mode: "solid", startColor: "rgb(0, 0, 0)" }, commas: true, decimals: 0, decoration: "none", end: HdFmJIJEO, font: { fontFamily: '"Geist", "Geist Placeholder", sans-serif', fontSize: "96px", fontStyle: "normal", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: "1em" }, height: "100%", id: "VG6OpvgLy", layoutId: "JourneyCard__VG6OpvgLy", mode: "default", monospace: false, prefix: "", start: 0, suffix: EEz2fPdEY, tag: "p", transition: { bounce: 0, delay: 0, duration: 1, type: "spring" }, userSelect: true, value: 0, width: "100%" }) }) }), /* @__PURE__ */ _jsx(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion2.p, { className: "framer-styles-preset-117cc1q", "data-styles-preset": "NAlnYZwzB", dir: "auto", children: "Delivering thoughtful interiors with precision and timeless expertise." }) }), className: "framer-1be7k6r", "data-framer-name": "Delivering thoughtful interiors with precision and timeless expertise.", fonts: ["Inter"], layoutDependency, layoutId: "JourneyCard__nZET6WQZb", style: { "--framer-paragraph-spacing": "0px" }, text: mhn8uOEcb, verticalAlignment: "top", withExternalLayout: true })] })] }) }) }) });
});
var css3 = [".framer-ZarM6.framer-15z22xr, .framer-ZarM6 .framer-15z22xr { display: block; }", ".framer-ZarM6.framer-12dwgjf { align-content: center; align-items: center; display: flex; flex-direction: column; flex-wrap: nowrap; gap: var(--1m53pry); height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: var(--1p91eci); position: relative; width: 100%; will-change: var(--framer-will-change-override, transform); }", ".framer-ZarM6 .framer-ak4y2x { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; height: min-content; justify-content: space-between; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-ZarM6 .framer-1c6ax6j { flex: 1 0 0px; height: auto; position: relative; white-space: pre-wrap; width: 1px; word-break: break-word; word-wrap: break-word; }", ".framer-ZarM6 .framer-ep9tpw { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 3px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: min-content; }", ".framer-ZarM6 .framer-dzkz9t, .framer-ZarM6 .framer-1jtd5mg, .framer-ZarM6 .framer-hx7ki3 { aspect-ratio: 1 / 1; flex: none; height: auto; position: relative; width: 6px; }", ".framer-ZarM6 .framer-1tyfy8z { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 24px; height: min-content; justify-content: flex-start; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-ZarM6 .framer-108y1yl-container { flex: none; height: auto; position: relative; width: auto; }", ".framer-ZarM6 .framer-1be7k6r { flex: none; height: auto; position: relative; white-space: pre-wrap; width: 100%; word-break: break-word; word-wrap: break-word; }", ...css2, ...css, '.framer-ZarM6[data-border="true"]::after, .framer-ZarM6 [data-border="true"]::after { content: ""; border-width: var(--border-top-width, 0) var(--border-right-width, 0) var(--border-bottom-width, 0) var(--border-left-width, 0); border-color: var(--border-color, none); border-style: var(--border-style, none); width: 100%; height: 100%; position: absolute; box-sizing: border-box; left: 0; top: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; }'];
var FramerD6hGfwxQc = withCSS(Component, css3, "framer-ZarM6");
var D6hGfwxQc_default = FramerD6hGfwxQc;
FramerD6hGfwxQc.displayName = "Journey Card";
FramerD6hGfwxQc.defaultProps = { height: 472, width: 416 };
addPropertyControls2(FramerD6hGfwxQc, { vdeHRpoDE: { defaultValue: "YEARS OF EXPERIENCE", displayTextArea: false, title: "Year", type: ControlType2.String }, onvdeHRpoDEChange: { changes: "vdeHRpoDE", type: ControlType2.ChangeHandler }, HdFmJIJEO: { defaultValue: 12, title: "End", type: ControlType2.Number }, onHdFmJIJEOChange: { changes: "HdFmJIJEO", type: ControlType2.ChangeHandler }, EEz2fPdEY: { defaultValue: "+", placeholder: "Suffix", title: "Suffix", type: ControlType2.String }, onEEz2fPdEYChange: { changes: "EEz2fPdEY", type: ControlType2.ChangeHandler }, mhn8uOEcb: { defaultValue: "Delivering thoughtful interiors with precision and timeless expertise.", displayTextArea: true, title: "Text", type: ControlType2.String }, onmhn8uOEcbChange: { changes: "mhn8uOEcb", type: ControlType2.ChangeHandler }, lK1PtWKKn: { defaultValue: 216, min: 0, title: "Gap", type: ControlType2.Number }, onlK1PtWKKnChange: { changes: "lK1PtWKKn", type: ControlType2.ChangeHandler }, uGdWbhkZM: { defaultValue: "32px", title: "Padding", type: ControlType2.Padding } });
addFonts(FramerD6hGfwxQc, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "/fonts/Inter-Regular.woff2", weight: "400" }, { cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "/fonts/Geist-Regular.woff2", weight: "500" }] }, ...AnimatedNumberCounterFonts, ...getFontsFromSharedStyle(fonts2), ...getFontsFromSharedStyle(fonts)], { supportsExplicitInterCodegen: true });
var __FramerMetadata__ = { "exports": { "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "default": { "type": "reactComponent", "name": "FramerD6hGfwxQc", "slots": [], "annotations": { "framerIntrinsicWidth": "416", "framerColorSyntax": "true", "framerVariables": '{"vdeHRpoDE":"year","HdFmJIJEO":"end","EEz2fPdEY":"suffix","mhn8uOEcb":"text","lK1PtWKKn":"gap","uGdWbhkZM":"padding"}', "framerAutoSizeImages": "true", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","auto"]}}}', "framerImmutableVariables": "true", "framerContractVersion": "1", "framerIntrinsicHeight": "472", "framerComponentViewportWidth": "true", "framerDisplayContentsDiv": "false" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  D6hGfwxQc_default as default
};
