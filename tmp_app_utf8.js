import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/App.tsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=7faef584"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
let prevRefreshReg;
let prevRefreshSig;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = RefreshRuntime.getRefreshReg("C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx");
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}
var _s = $RefreshSig$();
import __vite__cjsImport3_react from "/node_modules/.vite/deps/react.js?v=7faef584"; const useState = __vite__cjsImport3_react["useState"]; const useEffect = __vite__cjsImport3_react["useEffect"];
import { BrowserRouter as Router, Routes, Route, Navigate } from "/node_modules/.vite/deps/react-router-dom.js?v=5e0bf7dc";
import { onAuthStateChanged } from "/node_modules/.vite/deps/firebase_auth.js?v=c028a6e9";
import { auth } from "/src/lib/firebase.ts";
import Dashboard from "/src/pages/Dashboard.tsx";
import Login from "/src/pages/Login.tsx";
import { Toaster } from "/src/components/ui/toaster.tsx";
import { ThemeProvider } from "/src/components/theme-provider.tsx";
import { Loader2 } from "/node_modules/.vite/deps/lucide-react.js?v=5c5130cc";
function App() {
  _s();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user2) => {
      setUser(user2);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  if (loading) {
    return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen bg-black flex items-center justify-center", children: /* @__PURE__ */ jsxDEV(Loader2, { className: "w-10 h-10 text-blue-500 animate-spin" }, void 0, false, {
      fileName: "C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx",
      lineNumber: 47,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx",
      lineNumber: 46,
      columnNumber: 7
    }, this);
  }
  return /* @__PURE__ */ jsxDEV(Router, { children: /* @__PURE__ */ jsxDEV(ThemeProvider, { attribute: "class", defaultTheme: "dark", enableSystem: true, disableTransitionOnChange: true, children: [
    /* @__PURE__ */ jsxDEV(Routes, { children: [
      /* @__PURE__ */ jsxDEV(
        Route,
        {
          path: "/",
          element: /* @__PURE__ */ jsxDEV(Login, {}, void 0, false, {
            fileName: "C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx",
            lineNumber: 58,
            columnNumber: 22
          }, this)
        },
        void 0,
        false,
        {
          fileName: "C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx",
          lineNumber: 56,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        Route,
        {
          path: "/dashboard",
          element: user ? /* @__PURE__ */ jsxDEV(Dashboard, {}, void 0, false, {
            fileName: "C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx",
            lineNumber: 62,
            columnNumber: 29
          }, this) : /* @__PURE__ */ jsxDEV(Navigate, { to: "/login" }, void 0, false, {
            fileName: "C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx",
            lineNumber: 62,
            columnNumber: 45
          }, this)
        },
        void 0,
        false,
        {
          fileName: "C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx",
          lineNumber: 60,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        Route,
        {
          path: "/login",
          element: !user ? /* @__PURE__ */ jsxDEV(Login, {}, void 0, false, {
            fileName: "C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx",
            lineNumber: 66,
            columnNumber: 30
          }, this) : /* @__PURE__ */ jsxDEV(Navigate, { to: "/dashboard" }, void 0, false, {
            fileName: "C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx",
            lineNumber: 66,
            columnNumber: 42
          }, this)
        },
        void 0,
        false,
        {
          fileName: "C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx",
          lineNumber: 64,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        Route,
        {
          path: "*",
          element: /* @__PURE__ */ jsxDEV(Navigate, { to: "/" }, void 0, false, {
            fileName: "C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx",
            lineNumber: 70,
            columnNumber: 22
          }, this)
        },
        void 0,
        false,
        {
          fileName: "C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx",
          lineNumber: 68,
          columnNumber: 21
        },
        this
      )
    ] }, void 0, true, {
      fileName: "C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx",
      lineNumber: 55,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV(Toaster, {}, void 0, false, {
      fileName: "C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx",
      lineNumber: 73,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx",
    lineNumber: 54,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx",
    lineNumber: 53,
    columnNumber: 5
  }, this);
}
_s(App, "NiO5z6JIqzX62LS5UWDgIqbZYyY=");
_c = App;
export default App;
var _c;
$RefreshReg$(_c, "App");
if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}
if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("C:/Users/rosha/Desktop/project/sbu/sb-cafe-management/sb-cafe-management/src/App.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6IkFBMkJnQjs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEzQmhCLFNBQVNBLFVBQVVDLGlCQUFpQjtBQUNwQyxTQUFTQyxpQkFBaUJDLFFBQVFDLFFBQVFDLE9BQU9DLGdCQUFnQjtBQUNqRSxTQUFTQywwQkFBZ0M7QUFDekMsU0FBU0MsWUFBWTtBQUNyQixPQUFPQyxlQUFlO0FBQ3RCLE9BQU9DLFdBQVc7QUFFbEIsU0FBU0MsZUFBZTtBQUN4QixTQUFTQyxxQkFBcUI7QUFDOUIsU0FBU0MsZUFBZTtBQUV4QixTQUFTQyxNQUFNO0FBQUFDLEtBQUE7QUFDWCxRQUFNLENBQUNDLE1BQU1DLE9BQU8sSUFBSWpCLFNBQXNCLElBQUk7QUFDbEQsUUFBTSxDQUFDa0IsU0FBU0MsVUFBVSxJQUFJbkIsU0FBUyxJQUFJO0FBRTNDQyxZQUFVLE1BQU07QUFDWixVQUFNbUIsY0FBY2IsbUJBQW1CQyxNQUFNLENBQUNRLFVBQVM7QUFDbkRDLGNBQVFELEtBQUk7QUFDWkcsaUJBQVcsS0FBSztBQUFBLElBQ3BCLENBQUM7QUFFRCxXQUFPLE1BQU1DLFlBQVk7QUFBQSxFQUM3QixHQUFHLEVBQUU7QUFFTCxNQUFJRixTQUFTO0FBQ1QsV0FDSSx1QkFBQyxTQUFJLFdBQVUsMERBQ1gsaUNBQUMsV0FBUSxXQUFVLDBDQUFuQjtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBQXlELEtBRDdEO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0FFQTtBQUFBLEVBRVI7QUFFQSxTQUNJLHVCQUFDLFVBQ0csaUNBQUMsaUJBQWMsV0FBVSxTQUFRLGNBQWEsUUFBTyxjQUFZLE1BQUMsMkJBQXlCLE1BQ3ZGO0FBQUEsMkJBQUMsVUFDRztBQUFBO0FBQUEsUUFBQztBQUFBO0FBQUEsVUFDRyxNQUFLO0FBQUEsVUFDTCxTQUFTLHVCQUFDLFdBQUQ7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBTTtBQUFBO0FBQUEsUUFGbkI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLE1BRXVCO0FBQUEsTUFFdkI7QUFBQSxRQUFDO0FBQUE7QUFBQSxVQUNHLE1BQUs7QUFBQSxVQUNMLFNBQVNGLE9BQU8sdUJBQUMsZUFBRDtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUFVLElBQU0sdUJBQUMsWUFBUyxJQUFHLFlBQWI7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBcUI7QUFBQTtBQUFBLFFBRnpEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUU2RDtBQUFBLE1BRTdEO0FBQUEsUUFBQztBQUFBO0FBQUEsVUFDRyxNQUFLO0FBQUEsVUFDTCxTQUFTLENBQUNBLE9BQU8sdUJBQUMsV0FBRDtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUFNLElBQU0sdUJBQUMsWUFBUyxJQUFHLGdCQUFiO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQXlCO0FBQUE7QUFBQSxRQUYxRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFFOEQ7QUFBQSxNQUU5RDtBQUFBLFFBQUM7QUFBQTtBQUFBLFVBQ0csTUFBSztBQUFBLFVBQ0wsU0FBUyx1QkFBQyxZQUFTLElBQUcsT0FBYjtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUFnQjtBQUFBO0FBQUEsUUFGN0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLE1BRWlDO0FBQUEsU0FmckM7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQWlCQTtBQUFBLElBQ0EsdUJBQUMsYUFBRDtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBQVE7QUFBQSxPQW5CWjtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBb0JBLEtBckJKO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FzQkE7QUFFUjtBQUFDRCxHQTlDUUQsS0FBRztBQUFBTyxLQUFIUDtBQWdEVCxlQUFlQTtBQUFHLElBQUFPO0FBQUFDLGFBQUFELElBQUEiLCJuYW1lcyI6WyJ1c2VTdGF0ZSIsInVzZUVmZmVjdCIsIkJyb3dzZXJSb3V0ZXIiLCJSb3V0ZXIiLCJSb3V0ZXMiLCJSb3V0ZSIsIk5hdmlnYXRlIiwib25BdXRoU3RhdGVDaGFuZ2VkIiwiYXV0aCIsIkRhc2hib2FyZCIsIkxvZ2luIiwiVG9hc3RlciIsIlRoZW1lUHJvdmlkZXIiLCJMb2FkZXIyIiwiQXBwIiwiX3MiLCJ1c2VyIiwic2V0VXNlciIsImxvYWRpbmciLCJzZXRMb2FkaW5nIiwidW5zdWJzY3JpYmUiLCJfYyIsIiRSZWZyZXNoUmVnJCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJBcHAudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCdcclxuaW1wb3J0IHsgQnJvd3NlclJvdXRlciBhcyBSb3V0ZXIsIFJvdXRlcywgUm91dGUsIE5hdmlnYXRlIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSdcclxuaW1wb3J0IHsgb25BdXRoU3RhdGVDaGFuZ2VkLCBVc2VyIH0gZnJvbSAnZmlyZWJhc2UvYXV0aCdcclxuaW1wb3J0IHsgYXV0aCB9IGZyb20gJ0AvbGliL2ZpcmViYXNlJ1xyXG5pbXBvcnQgRGFzaGJvYXJkIGZyb20gJy4vcGFnZXMvRGFzaGJvYXJkJ1xyXG5pbXBvcnQgTG9naW4gZnJvbSAnLi9wYWdlcy9Mb2dpbidcclxuaW1wb3J0IFBlbmRpbmcgZnJvbSAnLi9wYWdlcy9QZW5kaW5nJ1xyXG5pbXBvcnQgeyBUb2FzdGVyIH0gZnJvbSAnQC9jb21wb25lbnRzL3VpL3RvYXN0ZXInXHJcbmltcG9ydCB7IFRoZW1lUHJvdmlkZXIgfSBmcm9tICdAL2NvbXBvbmVudHMvdGhlbWUtcHJvdmlkZXInXHJcbmltcG9ydCB7IExvYWRlcjIgfSBmcm9tICdsdWNpZGUtcmVhY3QnXHJcblxyXG5mdW5jdGlvbiBBcHAoKSB7XHJcbiAgICBjb25zdCBbdXNlciwgc2V0VXNlcl0gPSB1c2VTdGF0ZTxVc2VyIHwgbnVsbD4obnVsbClcclxuICAgIGNvbnN0IFtsb2FkaW5nLCBzZXRMb2FkaW5nXSA9IHVzZVN0YXRlKHRydWUpXHJcblxyXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcclxuICAgICAgICBjb25zdCB1bnN1YnNjcmliZSA9IG9uQXV0aFN0YXRlQ2hhbmdlZChhdXRoLCAodXNlcikgPT4ge1xyXG4gICAgICAgICAgICBzZXRVc2VyKHVzZXIpXHJcbiAgICAgICAgICAgIHNldExvYWRpbmcoZmFsc2UpXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgcmV0dXJuICgpID0+IHVuc3Vic2NyaWJlKClcclxuICAgIH0sIFtdKVxyXG5cclxuICAgIGlmIChsb2FkaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtaW4taC1zY3JlZW4gYmctYmxhY2sgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXJcIj5cclxuICAgICAgICAgICAgICAgIDxMb2FkZXIyIGNsYXNzTmFtZT1cInctMTAgaC0xMCB0ZXh0LWJsdWUtNTAwIGFuaW1hdGUtc3BpblwiIC8+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgIDxSb3V0ZXI+XHJcbiAgICAgICAgICAgIDxUaGVtZVByb3ZpZGVyIGF0dHJpYnV0ZT1cImNsYXNzXCIgZGVmYXVsdFRoZW1lPVwiZGFya1wiIGVuYWJsZVN5c3RlbSBkaXNhYmxlVHJhbnNpdGlvbk9uQ2hhbmdlPlxyXG4gICAgICAgICAgICAgICAgPFJvdXRlcz5cclxuICAgICAgICAgICAgICAgICAgICA8Um91dGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aD1cIi9cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50PXs8TG9naW4gLz59XHJcbiAgICAgICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICAgICAgICA8Um91dGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aD1cIi9kYXNoYm9hcmRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50PXt1c2VyID8gPERhc2hib2FyZCAvPiA6IDxOYXZpZ2F0ZSB0bz1cIi9sb2dpblwiIC8+fVxyXG4gICAgICAgICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPFJvdXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg9XCIvbG9naW5cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50PXshdXNlciA/IDxMb2dpbiAvPiA6IDxOYXZpZ2F0ZSB0bz1cIi9kYXNoYm9hcmRcIiAvPn1cclxuICAgICAgICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDxSb3V0ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoPVwiKlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ9ezxOYXZpZ2F0ZSB0bz1cIi9cIiAvPn1cclxuICAgICAgICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgICAgPC9Sb3V0ZXM+XHJcbiAgICAgICAgICAgICAgICA8VG9hc3RlciAvPlxyXG4gICAgICAgICAgICA8L1RoZW1lUHJvdmlkZXI+XHJcbiAgICAgICAgPC9Sb3V0ZXI+XHJcbiAgICApXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEFwcFxyXG4iXSwiZmlsZSI6IkM6L1VzZXJzL3Jvc2hhL0Rlc2t0b3AvcHJvamVjdC9zYnUvc2ItY2FmZS1tYW5hZ2VtZW50L3NiLWNhZmUtbWFuYWdlbWVudC9zcmMvQXBwLnRzeCJ9
