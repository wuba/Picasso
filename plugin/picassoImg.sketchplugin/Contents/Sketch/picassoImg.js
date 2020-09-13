var that = this;
function __skpm_run (key, context) {
  that.context = context;

var exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/save.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/save.js":
/*!*********************!*\
  !*** ./src/save.js ***!
  \*********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/**
 * 保存 sketch 到最新版本 52.2
 */
/* harmony default export */ __webpack_exports__["default"] = (function (context) {
  var sketchPath = "";
  var shapePath = "";
  var layerIds = "E103BC1D-6D0D-4BC1-A5AD-FE72E5A42C80_47_-49|D42365D9-DCD6-4D4C-9895-BA2D3918C6BE_384_19|E2AEF942-233F-4C2A-B7ED-441D6C304194_422.19479397506257_51.07892696825982|66307129-4905-45A0-8E02-A340B8C248E9_437.19479397506257_69.07892696825982|567774EC-0DBA-4DA6-95E6-6BB38F5642A4_449.19479397506257_82.07892696825982|A0E291D1-622C-45C9-BFD3-633657E53944_484_112|AD99977C-0DD3-4E79-82A2-D43DF0D10462_605.1011950492766_1899.496051439713|7EA77DDC-2E39-4AEC-B281-47047881A389_65.10119504927843_519.496051439713|E2DB6443-AADE-4F6E-9E08-83D31ADA38C3_597.1011950492766_1160.496051439713|DF7135A2-2340-4491-BA3B-4FB7B6699D53_627.9999999999982_1926|93B28917-8259-4328-AE98-634FB6E8E511_157_588|D762F778-B750-4FA7-B5FE-25F50AC10E93_157_1222|0B8670B3-1EE5-4F24-9E31-006542B1811D_157_1955|42418BA4-46E3-42A1-BC31-17D93C0098DB_68_721|B2D34059-FFE7-4F1C-A7F9-1603EACA0C42_482_721|10386FF1-FA5A-4153-9102-7C39694E1589_276_721|33A80801-275A-4D04-9D6F-CC9ED2888993_276_932|1362FB04-51A3-448D-84B0-143830736D32_68_932|04CDEF3A-D434-4F93-AD71-D0CEA085C0F0_482_932|36F62513-386A-4F43-8DBC-0DD8E85B84FF_173_148|47369485-EC94-4670-AD84-321A4608DAD9_86_209|97836020-0836-4198-97DC-FFAD6017FC2C_145_1405|E26D9477-7867-408E-A45E-57F6AFC8F026_223_1561|AAE4A662-43E8-40C7-8138-34B45F689698_145_2220|DD433420-5F9C-4C36-B952-2A2267DD7921_382_2450|FA09637A-061D-4978-86A9-885D2A20493B_145_2834|50E4E7B8-E67E-4261-A855-F4346A850B51_145_4578|F45B5778-9D36-4C5E-8090-D7ABD7D14385_145_3918|6AAFA2D3-596A-4E6B-8FC2-A216E5609B33_115_4032|CBF8CDE1-B544-4B79-9885-5B719813C4F6_145_5768|8A4170BD-87D7-4740-AB19-0DBEF1138745_145_3294|CF0A1A51-D991-4320-9081-B4E596DCA5D5_145_5038|C91B2AF8-5F63-47A0-A1A5-5F89A112CF50_147_1346|31F28ED9-664C-4BD9-BF72-1693A3EC3404_147_2079|AC9669D4-1777-4C20-9530-E86E2F827021_207_2730|45F1BDA4-40FC-46F0-9C2F-42C88DD98557_209_4438|13BBE47B-BA07-4DC2-99F0-2E73E491C908_182_3814|361BEC73-4E88-42DE-8C64-89EABAFBE613_301_5558|EC7BA146-E902-4ED7-8419-A9B293AA2121_145_2127|098F6B27-5FCE-4253-87A0-EA4F4077977B_145_2778|AF8AC1E9-72AF-4966-B4BC-4095ABEF28CA_145_4486|3D4F1520-FFF2-4E00-8051-EB312313EAE9_145_3862|F4D4EC50-F2D7-4140-88E9-C582DE313420_145_5606";
  var parentIds = "53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D";
  var parentLists ="53418A90-56F3-45C8-9F97-10025CC2404D|3ED769F4-CD2B-421D-B6F1-E9F1D38C37F3,53418A90-56F3-45C8-9F97-10025CC2404D|3ED769F4-CD2B-421D-B6F1-E9F1D38C37F3,53418A90-56F3-45C8-9F97-10025CC2404D|3ED769F4-CD2B-421D-B6F1-E9F1D38C37F3,53418A90-56F3-45C8-9F97-10025CC2404D|3ED769F4-CD2B-421D-B6F1-E9F1D38C37F3,53418A90-56F3-45C8-9F97-10025CC2404D|3ED769F4-CD2B-421D-B6F1-E9F1D38C37F3,53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|3599CF6F-B14F-4DEB-BB94-C774E48EF1C6,53418A90-56F3-45C8-9F97-10025CC2404D|3599CF6F-B14F-4DEB-BB94-C774E48EF1C6,53418A90-56F3-45C8-9F97-10025CC2404D|C8CFC1C3-7832-43B7-AACB-0CE8DF939C23,53418A90-56F3-45C8-9F97-10025CC2404D|C8CFC1C3-7832-43B7-AACB-0CE8DF939C23,53418A90-56F3-45C8-9F97-10025CC2404D|74B06D95-9EFC-4DAE-884A-34225BB99F95,53418A90-56F3-45C8-9F97-10025CC2404D|5B91F4D7-C7C6-4309-8B48-8304B8293CF9,53418A90-56F3-45C8-9F97-10025CC2404D|059298D2-DAC3-41B5-9468-FF17F4D74955,53418A90-56F3-45C8-9F97-10025CC2404D|059298D2-DAC3-41B5-9468-FF17F4D74955,53418A90-56F3-45C8-9F97-10025CC2404D|3824840C-D3B8-498C-85EB-F8AA388BA423,53418A90-56F3-45C8-9F97-10025CC2404D|C36A55B0-A4F3-4751-BF79-DF5545B51BEC,53418A90-56F3-45C8-9F97-10025CC2404D|DD98B65D-2757-4CDE-ADEB-14A46CC08FD1,53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D|53418A90-56F3-45C8-9F97-10025CC2404D";
  var Document = __webpack_require__(/*! sketch/dom */ "sketch/dom").Document;
  var sketch = __webpack_require__(/*! sketch/dom */ "sketch/dom");
  var Artboard = __webpack_require__(/*! sketch/dom */ "sketch/dom").Artboard;
  Document.open(sketchPath, function (err, document) {
    if (err) {
      // oh no, we failed to open the document
      log(err);
    } else {
      try {
        var options = { 
            output:shapePath,
            "group-contents-only": true,
            overwriting: true,
            scales: '1', 
            formats: 'png',
        };
        var layerIdList = layerIds.split('|');
        var parentIdList = parentIds.split('|');
        for (var i = 0; i < layerIdList.length; i++) {
            var layerId = layerIdList[i].split('_')[0];
            var layer = document.getLayerWithID(layerId);
            layer.frame.x = layerIdList[i].split('_')[1];
            layer.frame.y = layerIdList[i].split('_')[2];
            var parentId = parentIdList[i];
            var parent = document.getLayerWithID(parentId);
            var art = new Artboard({
                name: layerId,
                frame: parent.frame,
                layers: [layer],
                background: {
                    enabled: false,
                },
            })
            document.pages[0].layers.push(art);
            sketch.export(art,options);
        }
        document.save(sketchPath, function (err) {
          if (err) {// saving the document failed :(
            log(err);
          }
        //   document.close();
        });
      } catch (error) {
        log(error);
      }
    }
  });
});

/***/ }),

/***/ "sketch/dom":
/*!*****************************!*\
  !*** external "sketch/dom" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("sketch/dom");

/***/ })

/******/ });
  if (key === 'default' && typeof exports === 'function') {
    exports(context);
  } else {
    exports[key](context);
  }
}
that['onRun'] = __skpm_run.bind(this, 'default')

//# sourceMappingURL=save.js.map
