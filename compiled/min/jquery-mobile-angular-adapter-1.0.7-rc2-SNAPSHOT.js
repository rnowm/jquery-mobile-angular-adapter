(function(a){var b=a.mobile.selectmenu.prototype,c=b.destroy;b.destroy=function(){var a=this.element.closest(".ui-select"),b=this.menuPage,d=this.screen,e=this.listbox;c.apply(this,arguments),a&&a.remove(),b&&b.remove(),d&&d.remove(),e&&e.remove()};var b=a.mobile.button.prototype,c=b.destroy;b.destroy=function(){c.apply(this,arguments),this.button.remove()};var b=a.mobile.listview.prototype,c=b.destroy;b.destroy=function(){var b=this.element.attr("id"),d=new RegExp(a.mobile.subPageUrlKey+"="+b+"-"),e=this.childPages();c.apply(this,arguments);for(var f=0;f<e.length;f++){var g=a(e[f]),h=g.attr("data-url");h.match(d)&&g.remove()}};var b=a.mobile.slider.prototype,d=b._create;b._create=function(){var b=d.apply(this,arguments),c=this.element[0].parentNode,e=document.createElement("div");return c.insertBefore(e,this.element[0]),e.appendChild(this.element[0]),e.appendChild(this.slider[0]),this.wrapper=a(e),b};var c=b.destroy;b.destroy=function(){c.apply(this,arguments),this.wrapper.remove()}})(window.jQuery),function(a){var b=a.module("ng");b.config(["$provide",function(a){a.decorator("$rootScope",["$delegate",function(a){return a.$disconnect=function(){if(this.$root==this)return;var a=this.$parent;this.$$disconnected=!0,a.$$childHead==this&&(a.$$childHead=this.$$nextSibling),a.$$childTail==this&&(a.$$childTail=this.$$prevSibling),this.$$prevSibling&&(this.$$prevSibling.$$nextSibling=this.$$nextSibling),this.$$nextSibling&&(this.$$nextSibling.$$prevSibling=this.$$prevSibling),this.$$nextSibling=this.$$prevSibling=null},a.$reconnect=function(){if(this.$root==this)return;var a=this;if(!a.$$disconnected)return;var b=a.$parent;a.$$disconnected=!1,a.$$prevSibling=b.$$childTail,b.$$childHead?(b.$$childTail.$$nextSibling=a,b.$$childTail=a):b.$$childHead=b.$$childTail=a},a}])}])}(window.angular),function(a){var b=a.module("ng");b.config(["$provide",function(a){a.decorator("$rootScope",["$delegate",function(a){var b=a.$apply;a.$apply=function(){return a.$$phase?a.$eval.apply(this,arguments):b.apply(this,arguments)};var c=!1,d=a.$digest;return a.$digest=function(){if(a.$$phase)return;var b=d.apply(this,arguments)},a}])}])}(window.angular),function(a,b){function e(a,b){if(!b)return d[a];var c=d[a];d[a]=!0;var e=b();return d[a]=c,e}function f(a){return e("preventJqmWidgetCreation",a)}function g(a){return e("markJqmWidgetCreation",a)}function h(b){f(function(){var c=a.mobile.page.prototype.widgetEventPrefix;a.mobile.page.prototype.widgetEventPrefix="noop",b.page(),a.mobile.page.prototype.widgetEventPrefix=c})}function j(b,c){a.fn.orig[b]=a.fn.orig[b]||a.fn[b],a.fn[b]=c}function k(b){j(b,function(){return g()&&this.attr("jqm-widget",b),f()?!1:a.fn.orig[b].apply(this,arguments)})}var c=b.module("ng");a("div").live("pagebeforeshow",function(b,c){var d=a(b.target),e=d.scope();e&&e.$root.$digest()}),c.config(["$provide",function(b){b.decorator("$rootScope",["$delegate",function(b){var c=b.$digest,d;return b.$digest=function(){if(this===b){var e=a.mobile.activePage,f=e&&e.scope();d&&d!==f&&d.$disconnect(),d=f,f&&f.$reconnect()}return c.apply(this,arguments)},b}])}]);var d={};a.mobile.autoInitializePage=!1;var i=!1;c.config(["$provide",function(a){a.decorator("$compile",["$delegate",function(a){var b=':jqmData(role="page"), :jqmData(role="dialog")',c="jqm-page";return function(d){var e=d.filter(b).add(d.find(b));return h(e),g(function(){f(function(){e.length>0?e.trigger("create"):d.parent().trigger("create")})}),e.page("destroy"),e.attr(c,!0),a.apply(this,arguments)}}])}]),c.directive("jqmPage",["$compile",function(b){return{restrict:"A",scope:!0,compile:function(b,c){return{pre:function(c,d,e){h(d),i||(i=!0,a.mobile.initializePage()),c.$disconnect()},post:function(a,b,c){f(function(){var a=b.data("page");a._trigger("create")})}}}}}]),a.fn.orig={},c.run(["$rootScope","$compile",function(b,c){j("page",function(){return!f()&&!this.data("page")&&this.attr("data-"+a.mobile.ns+"external-page")&&c(this)(b),a.fn.orig.page.apply(this,arguments)})}]);var l={};c.directive("jqmWidget",function(){return{require:["?ngModel"],compile:function(){return{post:function(a,b,c,d){var e=c.jqmWidget;b.data(e)||b[e]();var f=l[e];for(var g=0;g<f.length;g++)f[g].apply(this,arguments)}}}}}),a.mobile.registerJqmNgWidget=function(a,b){var c=b?[b]:[];l[a]=c,k(a)}}(window.jQuery,window.angular),function(a){function e(a,b){return function(c,d,e,f){for(var g=0;g<b.length;g++)b[g](a,c,d,e,f)}}function f(a,b,c,d,e){d.$observe("disabled",function(b){b?c[a]("disable"):c[a]("enable")})}function g(a,b,c){var d="_listeners"+b;if(!a[d]){a[d]=[];var e=a[b];a[b]=function(){var b=e.apply(this,arguments);for(var c=0;c<a[d].length;c++)a[d][c]();return b}}a[d].push(c)}function h(a,b,c,d,e){var f=e[0];f&&g(f,"$render",function(){j(a,b,c)})}function i(a,b,c,d,e){b.$on("$childrenChanged",function(){j(a,b,c)})}function j(a,b,c,d,e){var f="_refresh"+a;b[f]=b[f]+1||1,b.$evalAsync(function(){b[f]--,b[f]===0&&c[a]("refresh")})}var b={button:{handlers:[f]},collapsible:{handlers:[f]},textinput:{handlers:[f]},checkboxradio:{handlers:[f,h]},slider:{handlers:[f,h]},listview:{handlers:[i]},collapsibleset:{handlers:[i]},selectmenu:{handlers:[f,h,i]},controlgroup:{handlers:[i]}},c;for(var d in b)c=b[d],$.mobile.registerJqmNgWidget(d,e(d,c.handlers))}(window.angular),function(a){function c(a){a.onHashChange=function(a){return $(window).bind("hashchange",a),a};var b=location.href;a.url=function(a){return a&&(b=a),b}}var b=a.module("ng");c.$inject=["$browser"],b.run(c)}(window.angular),function(a,b){function c(a,b,d,e){var f=d[e];d[e]=function(d){var g=this;while(g.parent()[0]!==b){g=g.parent();if(g.length===0)throw new Error("Could not find the expected parent in the node path",this,b)}c(a,b,d,e);var h=f.call(g,d);return h}}function d(a,b){if(!!a^!!b)return!1;for(var c in a)if(b[c]!==a[c])return!1;for(var c in b)if(b[c]!==a[c])return!1;return!0}function e(a){if(!a)return a;var b;a.length?b=[]:b={};for(var c in a)b[c]=a[c];return b}var f=b.module("ng");f.directive("ngRepeat",function(){return{priority:1e3,compile:function(a,b,f){return{pre:function(a,b,f){c(a,b.parent()[0],b,"after");var g=f.ngRepeat,h=g.match(/^.+in\s+(.*)\s*$/);if(!h)throw Error("Expected ngRepeat in form of '_item_ in _collection_' but got '"+g+"'.");var i=h[1],j,k=0;a.$watch(function(){var b=a.$eval(i);return d(b,j)||(j=e(b),k++),k},function(){a.$emit("$childrenChanged")})}}}}})}(window.jQuery,window.angular),function(a,b){function c(a){var b=[];for(var c in a)a.hasOwnProperty(c)&&b.push(c);return b.sort()}var d=/^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w\d]*)|(?:\(\s*([\$\w][\$\w\d]*)\s*,\s*([\$\w][\$\w\d]*)\s*\)))\s+in\s+(.*)$/,e=b.module("ng");e.directive("ngOptions",["$parse",function(a){return{require:["select","?ngModel"],link:function(b,e,f,g){function p(){var a=[],d,e=o(b)||[],f=l?c(e):e,g,h,i={};for(h=0;g=f.length,h<g;h++){var n=e[h];i[k]=e[l?i[l]=f[h]:h],d=m(b,i),a.push({id:l?f[h]:h,label:j(b,i),optionGroup:d})}return a}if(!g[1])return;var h,i=f.ngOptions;if(!(h=i.match(d)))throw Error("Expected ngOptions in form of '_select_ (as _label_)? for (_key_,)?_value_ in _collection_' but got '"+i+"'.");var j=a(h[2]||h[1]),k=h[4]||h[6],l=h[5],m=a(h[3]||""),n=a(h[2]?h[1]:k),o=a(h[7]);b.$watch(p,function(){b.$emit("$childrenChanged")},!0)}}}])}(window.jQuery,window.angular),function(a){var b=a.module("ng");b.directive("option",["$interpolate",function(a){return{restrict:"E",compile:function(b,c){var d=a(b.text(),!0),e=a(b.attr("value"),!0);return function(a,b,c){a.$watch(d,function(){a.$emit("$childrenChanged")}),a.$watch(e,function(){a.$emit("$childrenChanged")})}}}}])}(window.angular),function(a){var b=a.module("ng");b.directive("ngSwitch",function(){return{restrict:"EA",compile:function(a,b){var c=b.ngSwitch||b.on;return function(a,b){a.$watch(c,function(b){a.$emit("$childrenChanged")})}}}})}(window.angular),function(a){var b=a.module("ng");b.directive("ngInclude",function(){return{restrict:"ECA",compile:function(a,b){var c=b.ngInclude||b.src;return function(a,b){a.$watch(c,function(b){a.$emit("$childrenChanged")}),a.$on("$includeContentLoaded",function(){a.$emit("$childrenChanged")})}}}})}(window.angular),function(a,b){var c=b.module("ng");c.directive("input",function(){return{restrict:"E",require:"?ngModel",compile:function(a,b){var c=a.attr("type");return{pre:function(a,b,d,e){if(!e)return;var f=[];c==="date"&&f.push("blur"),f.push("change");var g=b.bind;b.bind=function(a,b){if(a.indexOf("input")!=-1||a.indexOf("change")!=-1)for(var c=0;c<f.length;c++){var d=f[c];a.indexOf(d)===-1&&(a+=" "+d)}return g.call(this,a,b)}}}}}})}(window.jQuery,window.angular),function(a){var b={transclude:"element",priority:1e3,terminal:!0,compile:function(a,b,c){return function(a,b,d){var e=d.ngmIf,f,g;a.$watch(e,function(d){d?(g=a.$new(),c(g,function(a){f=a,b.after(a)})):(f&&f.remove(),g&&g.$destroy()),a.$emit("$childrenChanged")})}}},c=a.module("ng");c.directive("ngmIf",function(){return b})}(window.angular),function(a){function c(a,b,c,d){b.bind(c,function(e){var f=a.$apply(d,b);c.charAt(0)=="v"&&e.preventDefault()})}function d(a,d){b.directive(a,function(){return function(b,e,f){var g=f[a];c(b,e,d,g)}})}var b=a.module("ng");b.directive("ngmEvent",function(){return{compile:function(b,d){var e=a.fromJson(d.ngmEvent);return function(a,b,d){for(var f in e)c(a,b,f,e[f])}}}});var e={ngmTaphold:"taphold",ngmSwipe:"swipe",ngmSwiperight:"swiperight",ngmSwipeleft:"swipeleft",ngmPagebeforeshow:"pagebeforeshow",ngmPagebeforehide:"pagebeforehide",ngmPageshow:"pageshow",ngmPagehide:"pagehide",ngmClick:"vclick"};for(var f in e)d(f,e[f])}(window.angular),function(a,b){function c(a){var b=a.indexOf(":");return b===-1?[a]:[a.substring(0,b),a.substring(b+1)]}function d(b,c){b&&a(document).one("pagebeforechange",function(d,e){function h(){var a=g.scope();a[b].apply(a,c)}var f=a.mobile.path.parseUrl(e.toPage),g=a("#"+f.hash.substring(1));if(!g.data("page")){g.one("pagecreate",h);return}h()})}function e(a,b){var e=Array.prototype.slice.call(arguments,2),g,i;d(b,e);if(typeof a=="object")g=a,i=g.target;else{var j=c(a);if(j.length===2&&j[0]==="back"){var i=j[1],k=h(i);k===undefined?i=f(i,{reverse:!0}):window.history.go(k);return}j.length===2?(g={transition:j[0]},i=j[1]):(i=j[0],g=undefined)}i==="back"?window.history.go(-1):f(i,g)}function f(b,c){var d=[b];return c&&d.push(c),a.mobile.changePage.apply(a.mobile,d),b}function h(b){var c=a.mobile.urlHistory.stack,d=0,e;for(var f=c.length-2;f>=0;f--){e=c[f].pageUrl;if(e===b)return f-c.length+1}return undefined}var g=b.module("ng");return g.factory("$navigate",function(){return e}),e}(window.jQuery,window.angular),function(a){function c(a){return a[b]=a[b]||{}}function d(a,b,d,e){var f=c(a),g=f[b];return g||(g=a.$new(),d(b,{$scope:g}),f[b]=g,g.$$referenceCount=0),g.$$referenceCount++,e.bind("$destroy",function(){g.$$referenceCount--,g.$$referenceCount===0&&(g.$destroy(),delete f[b])}),g}function e(a){var b=/([^\s,:]+)\s*:\s*([^\s,:]+)/g,c,d=!1,e={};while(c=b.exec(a))d=!0,e[c[1]]=c[2];if(!d)throw"Expression "+a+" needs to have the syntax <name>:<controller>,...";return e}var b="$$sharedControllers",f=a.module("ng");f.directive("ngmSharedController",["$controller",function(a){return{scope:!0,compile:function(b,c){var f=c.ngmSharedController,g=e(f),h=function(c){for(var e in g)c[e]=d(c.$root,g[e],a,b)};return{pre:h}}}}])}(window.angular),function(a,b){function d(a){var b=c[c.length-1];b.callback&&o.$apply(function(){b.callback.apply(this,arguments)}),a.preventDefault()}function f(){if(!e||e.length==0)e=a(".ui-loader"),e.bind("vclick",d)}function g(){f();if(c.length>0){var b=c[c.length-1],d=b.msg,e=a.mobile.loadingMessage,g=a.mobile.loadingMessageTextVisible;d&&(a.mobile.loadingMessage=d,a.mobile.loadingMessageTextVisible=!0),a.mobile.showPageLoadingMsg(),a.mobile.loadingMessageTextVisible=g,a.mobile.loadingMessage=e}else a.mobile.hidePageLoadingMsg()}function h(){var a,b;typeof arguments[0]=="string"&&(a=arguments[0]),typeof arguments[0]=="function"&&(b=arguments[0]),typeof arguments[1]=="function"&&(b=arguments[1]),c.push({msg:a,callback:b}),g()}function i(){c.pop(),g()}function j(a,b){a.then(b,b)}function k(a,b){h(b),j(a,function(){i()})}function l(b,c,d){d||(d=a.mobile.loadingMessageWithCancel),h(d,function(){b.reject(c)}),j(b.promise,function(){i()})}var c=[],e;a.mobile.loadingMessageWithCancel||(a.mobile.loadingMessageWithCancel="Loading. Click to cancel."),a("div").live("pageshow",function(a,b){g()});var m={show:h,hide:i,waitFor:k,waitForWithCancel:l},n=b.module("ng"),o;return n.factory("$waitDialog",["$rootScope",function(a){return o=a,m}]),m}(window.jQuery,window.angular),function(a,b){function c(a,c,d){function e(e){function r(a){u(-1),i=a,j=[],k=!0,z()}function s(){var a=i;j=[].concat(a),l&&(a=c(a,l)),m&&(a=d(a,m)),n<h&&(n=h),n>a.length&&(n=a.length),o=a.length;var b=a.slice(0,n),e=[0,g.length].concat(b);g.splice.apply(g,e),g.refreshCount++}function t(){if(i.length!=j.length)k=!0;else for(var a=0;a<i.length;a++)if(i[a]!==j[a]){k=!0;break}return k&&(s(),k=!1),g}function u(b){if(!b||b<0)b=a;b!==h&&(h=b,k=!0)}function v(a){b.equals(l,a)||(l=a,k=!0)}function w(a){b.equals(m,a)||(m=a,k=!0)}function x(){n+=h,k=!0}function y(){return t(),n<o}function z(){n=0,k=!0}var f={refreshIfNeeded:t,setFilter:v,setOrderBy:w,setPageSize:u,loadNextPage:x,hasMorePages:y,reset:z,refreshCount:0},g=[],h,i,j,k,l,m,n,o;for(var p in f)g[p]=f[p];r(e);var q=g.hasOwnProperty;return g.hasOwnProperty=function(a){return a in f?!1:q.apply(this,arguments)},g}return function(a,b){if(!a)return a;var c=a.pagedList;if(typeof b=="string"){if(!c)return;if(b==="loadMore")c.loadNextPage();else if(b==="hasMore")return c.hasMorePages();return}return c||(c=e(a),a.pagedList=c),b&&(c.setPageSize(b.pageSize),c.setFilter(b.filter),c.setOrderBy(b.orderBy)),c.refreshIfNeeded(),c}}c.$inject=["defaultListPageSize","filterFilter","orderByFilter"];var d=b.module(["ng"]);d.constant("defaultListPageSize",10),d.filter("paged",c)}(window.jQuery,window.angular)