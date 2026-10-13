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

// http-url:https://framerusercontent.com/modules/a6xbht2oBxPfn2Y8mrhV/JKfwvwVvRvkiThcgKsqW/TkYXe2Hje.js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { addFonts, addPropertyControls, ControlType, cx, useActiveVariantCallback, useComponentViewport, useLocaleInfo, useOnVariantChange, useVariantState, withCSS } from "./_framer-runtime.js";
import { LayoutGroup, motion, MotionConfigContext } from "framer-motion";
import * as React from "react";
import { useRef } from "react";
var cycleOrder = ["GQGceR8k_", "wRnC3lab8", "O1stxaQ9K", "waVJDsq1d", "YK5huYsE0", "k35sFwlo8"];
var serializationHash = "framer-rmuq6";
var variantClassNames = { GQGceR8k_: "framer-v-180yuco", k35sFwlo8: "framer-v-1814lnt", O1stxaQ9K: "framer-v-l6tixd", waVJDsq1d: "framer-v-5m4u2a", wRnC3lab8: "framer-v-wu7krl", YK5huYsE0: "framer-v-1abb867" };
function addPropertyOverrides(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition1 = { delay: 0, duration: 0.8, ease: [0.96, -0.02, 0.38, 1.01], type: "tween" };
var Transition = ({ value, children }) => {
  const config = React.useContext(MotionConfigContext);
  const transition = value ?? config.transition;
  const contextValue = React.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx(MotionConfigContext.Provider, { value: contextValue, children });
};
var humanReadableVariantMap = { "1": "GQGceR8k_", "2": "wRnC3lab8", "3": "O1stxaQ9K", "4": "waVJDsq1d", "5": "YK5huYsE0", "6": "k35sFwlo8" };
var Variants = motion.create(React.Fragment);
var getProps = ({ height, id, width, ...props }) => {
  return { ...props, variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "GQGceR8k_" };
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
  const { style, className, layoutId, variant, ...restProps } = getProps(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ cycleOrder, defaultVariant: "GQGceR8k_", ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback(baseVariant);
  const onAppearhwf8md = activeVariantCallback(async (...args) => {
    setVariant("wRnC3lab8");
  });
  const onAppear1bfx4ev = activeVariantCallback(async (...args) => {
    await delay(() => setVariant("O1stxaQ9K"), 50);
  });
  const onAppear1p72ut0 = activeVariantCallback(async (...args) => {
    await delay(() => setVariant("waVJDsq1d"), 100);
  });
  const onAppear1qn9zat = activeVariantCallback(async (...args) => {
    await delay(() => setVariant("YK5huYsE0"), 150);
  });
  const onAppearrktpj1 = activeVariantCallback(async (...args) => {
    await delay(() => setVariant("k35sFwlo8"), 150);
  });
  useOnVariantChange(baseVariant, { default: onAppearhwf8md, k35sFwlo8: void 0, O1stxaQ9K: onAppear1p72ut0, waVJDsq1d: onAppear1qn9zat, wRnC3lab8: onAppear1bfx4ev, YK5huYsE0: onAppearrktpj1 });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx(Transition, { value: transition1, children: /* @__PURE__ */ _jsx(motion.section, { ...restProps, ...gestureHandlers, className: cx(scopingClassNames, "framer-180yuco", className, classNames), "data-framer-name": "1", "data-highlight": true, layoutDependency, layoutId: "PreLoader__GQGceR8k_", ref: refBinding, style: { ...style }, ...addPropertyOverrides({ k35sFwlo8: { "data-framer-name": "6", "data-highlight": void 0 }, O1stxaQ9K: { "data-framer-name": "3" }, waVJDsq1d: { "data-framer-name": "4" }, wRnC3lab8: { "data-framer-name": "2" }, YK5huYsE0: { "data-framer-name": "5" } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsxs(motion.div, { className: "framer-1s9qoiw", "data-framer-name": "BG", layoutDependency, layoutId: "PreLoader__YPuSTa0rf", children: [/* @__PURE__ */ _jsxs(motion.div, { className: "framer-xpbr90", "data-framer-name": "Top", layoutDependency, layoutId: "PreLoader__b5WeTYKIn", children: [/* @__PURE__ */ _jsx(motion.div, { className: "framer-1he5ic4", "data-framer-name": "1", layoutDependency, layoutId: "PreLoader__pIZfAUJLq", style: { backgroundColor: "var(--token-88eff137-1274-4a36-b366-ef51c420159a, rgb(0, 0, 0))" } }), /* @__PURE__ */ _jsx(motion.div, { className: "framer-fj60xm", "data-framer-name": "2", layoutDependency, layoutId: "PreLoader__tVJsM3DDq", style: { backgroundColor: "var(--token-88eff137-1274-4a36-b366-ef51c420159a, rgb(0, 0, 0))" } }), /* @__PURE__ */ _jsx(motion.div, { className: "framer-j7zpq9", "data-framer-name": "3", layoutDependency, layoutId: "PreLoader__dVxivtMWJ", style: { backgroundColor: "var(--token-88eff137-1274-4a36-b366-ef51c420159a, rgb(0, 0, 0))" } }), /* @__PURE__ */ _jsx(motion.div, { className: "framer-12o3976", "data-framer-name": "4", layoutDependency, layoutId: "PreLoader__DBwDgVpdB", style: { backgroundColor: "var(--token-88eff137-1274-4a36-b366-ef51c420159a, rgb(0, 0, 0))" } }), /* @__PURE__ */ _jsx(motion.div, { className: "framer-s8139s", "data-framer-name": "5", layoutDependency, layoutId: "PreLoader__K6Uw7JNHY", style: { backgroundColor: "var(--token-88eff137-1274-4a36-b366-ef51c420159a, rgb(0, 0, 0))" } }), /* @__PURE__ */ _jsx(motion.div, { className: "framer-1yx169p", "data-framer-name": "6", layoutDependency, layoutId: "PreLoader__eK1xfvdy3", style: { backgroundColor: "var(--token-88eff137-1274-4a36-b366-ef51c420159a, rgb(0, 0, 0))" } })] }), /* @__PURE__ */ _jsxs(motion.div, { className: "framer-fy1l29", "data-framer-name": "Bottom", layoutDependency, layoutId: "PreLoader__ABirU1Oof", children: [/* @__PURE__ */ _jsx(motion.div, { className: "framer-158yjea", "data-framer-name": "1", layoutDependency, layoutId: "PreLoader__JRY95aI_m", style: { backgroundColor: "var(--token-88eff137-1274-4a36-b366-ef51c420159a, rgb(0, 0, 0))" } }), /* @__PURE__ */ _jsx(motion.div, { className: "framer-102x440", "data-framer-name": "2", layoutDependency, layoutId: "PreLoader__Blo_aWf9Z", style: { backgroundColor: "var(--token-88eff137-1274-4a36-b366-ef51c420159a, rgb(0, 0, 0))" } }), /* @__PURE__ */ _jsx(motion.div, { className: "framer-1cdrus6", "data-framer-name": "3", layoutDependency, layoutId: "PreLoader__ZZsjQ0Adl", style: { backgroundColor: "var(--token-88eff137-1274-4a36-b366-ef51c420159a, rgb(0, 0, 0))" } }), /* @__PURE__ */ _jsx(motion.div, { className: "framer-qntbne", "data-framer-name": "4", layoutDependency, layoutId: "PreLoader__HWrOd6URA", style: { backgroundColor: "var(--token-88eff137-1274-4a36-b366-ef51c420159a, rgb(0, 0, 0))" } }), /* @__PURE__ */ _jsx(motion.div, { className: "framer-1up199b", "data-framer-name": "5", layoutDependency, layoutId: "PreLoader__tKE7JohLS", style: { backgroundColor: "var(--token-88eff137-1274-4a36-b366-ef51c420159a, rgb(0, 0, 0))" } }), /* @__PURE__ */ _jsx(motion.div, { className: "framer-1kqips", "data-framer-name": "6", layoutDependency, layoutId: "PreLoader__hKP2Jlzbf", style: { backgroundColor: "var(--token-88eff137-1274-4a36-b366-ef51c420159a, rgb(0, 0, 0))" } })] })] }) }) }) }) });
});
var css = [".framer-rmuq6.framer-1ijeqdb, .framer-rmuq6 .framer-1ijeqdb { display: block; }", ".framer-rmuq6.framer-180yuco { align-content: center; align-items: center; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 12px; height: auto; justify-content: center; overflow: hidden; padding: 0px; position: relative; width: 100%; }", ".framer-rmuq6 .framer-1s9qoiw { align-content: flex-end; align-items: flex-end; bottom: -1px; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 0px; justify-content: center; left: calc(50.00000000000002% - 100% / 2); overflow: visible; padding: 0px; position: absolute; top: -1px; width: 100%; z-index: 0; }", ".framer-rmuq6 .framer-xpbr90 { align-content: center; align-items: center; display: flex; flex: 1 0 0px; flex-direction: row; flex-wrap: nowrap; gap: 0px; height: 1px; justify-content: center; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-rmuq6 .framer-1he5ic4, .framer-rmuq6 .framer-fj60xm, .framer-rmuq6 .framer-j7zpq9, .framer-rmuq6 .framer-12o3976, .framer-rmuq6 .framer-s8139s, .framer-rmuq6 .framer-1yx169p, .framer-rmuq6 .framer-158yjea, .framer-rmuq6 .framer-102x440, .framer-rmuq6 .framer-1cdrus6, .framer-rmuq6 .framer-qntbne, .framer-rmuq6 .framer-1up199b, .framer-rmuq6 .framer-1kqips { flex: none; height: 100%; overflow: visible; position: relative; width: 17%; }", ".framer-rmuq6 .framer-fy1l29 { align-content: flex-end; align-items: flex-end; display: flex; flex: 1 0 0px; flex-direction: row; flex-wrap: nowrap; gap: 0px; height: 1px; justify-content: center; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-rmuq6.framer-v-wu7krl .framer-xpbr90, .framer-rmuq6.framer-v-l6tixd .framer-xpbr90, .framer-rmuq6.framer-v-5m4u2a .framer-xpbr90, .framer-rmuq6.framer-v-1abb867 .framer-xpbr90, .framer-rmuq6.framer-v-1814lnt .framer-xpbr90 { align-content: flex-start; align-items: flex-start; }", ".framer-rmuq6.framer-v-wu7krl .framer-j7zpq9, .framer-rmuq6.framer-v-wu7krl .framer-1cdrus6, .framer-rmuq6.framer-v-l6tixd .framer-j7zpq9, .framer-rmuq6.framer-v-l6tixd .framer-12o3976, .framer-rmuq6.framer-v-l6tixd .framer-1cdrus6, .framer-rmuq6.framer-v-l6tixd .framer-qntbne, .framer-rmuq6.framer-v-5m4u2a .framer-fj60xm, .framer-rmuq6.framer-v-5m4u2a .framer-j7zpq9, .framer-rmuq6.framer-v-5m4u2a .framer-12o3976, .framer-rmuq6.framer-v-5m4u2a .framer-102x440, .framer-rmuq6.framer-v-5m4u2a .framer-1cdrus6, .framer-rmuq6.framer-v-5m4u2a .framer-qntbne, .framer-rmuq6.framer-v-1abb867 .framer-fj60xm, .framer-rmuq6.framer-v-1abb867 .framer-j7zpq9, .framer-rmuq6.framer-v-1abb867 .framer-12o3976, .framer-rmuq6.framer-v-1abb867 .framer-s8139s, .framer-rmuq6.framer-v-1abb867 .framer-102x440, .framer-rmuq6.framer-v-1abb867 .framer-1cdrus6, .framer-rmuq6.framer-v-1abb867 .framer-qntbne, .framer-rmuq6.framer-v-1abb867 .framer-1up199b, .framer-rmuq6.framer-v-1814lnt .framer-1he5ic4, .framer-rmuq6.framer-v-1814lnt .framer-fj60xm, .framer-rmuq6.framer-v-1814lnt .framer-j7zpq9, .framer-rmuq6.framer-v-1814lnt .framer-12o3976, .framer-rmuq6.framer-v-1814lnt .framer-s8139s, .framer-rmuq6.framer-v-1814lnt .framer-1yx169p, .framer-rmuq6.framer-v-1814lnt .framer-158yjea, .framer-rmuq6.framer-v-1814lnt .framer-102x440, .framer-rmuq6.framer-v-1814lnt .framer-1cdrus6, .framer-rmuq6.framer-v-1814lnt .framer-qntbne, .framer-rmuq6.framer-v-1814lnt .framer-1up199b, .framer-rmuq6.framer-v-1814lnt .framer-1kqips { height: 1px; }"];
var FramerTkYXe2Hje = withCSS(Component, css, "framer-rmuq6");
var TkYXe2Hje_default = FramerTkYXe2Hje;
FramerTkYXe2Hje.displayName = "Pre-Loader";
FramerTkYXe2Hje.defaultProps = { height: 834, width: 1440 };
addPropertyControls(FramerTkYXe2Hje, { variant: { options: ["GQGceR8k_", "wRnC3lab8", "O1stxaQ9K", "waVJDsq1d", "YK5huYsE0", "k35sFwlo8"], optionTitles: ["1", "2", "3", "4", "5", "6"], title: "Variant", type: ControlType.Enum } });
addFonts(FramerTkYXe2Hje, [{ explicitInter: true, fonts: [] }], { supportsExplicitInterCodegen: true });
var __FramerMetadata__ = { "exports": { "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "default": { "type": "reactComponent", "name": "FramerTkYXe2Hje", "slots": [], "annotations": { "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","fixed"]},"wRnC3lab8":{"layout":["fixed","fixed"]},"O1stxaQ9K":{"layout":["fixed","fixed"]},"waVJDsq1d":{"layout":["fixed","fixed"]},"YK5huYsE0":{"layout":["fixed","fixed"]},"k35sFwlo8":{"layout":["fixed","fixed"]}}}', "framerIntrinsicWidth": "1440", "framerDisplayContentsDiv": "false", "framerAutoSizeImages": "true", "framerImmutableVariables": "true", "framerComponentViewportWidth": "true", "framerIntrinsicHeight": "834", "framerContractVersion": "1", "framerColorSyntax": "true" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  TkYXe2Hje_default as default
};
