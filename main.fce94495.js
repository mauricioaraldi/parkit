!function(e){function t(t){for(var r,i,a=t[0],c=t[1],l=t[2],u=0,d=[];u<a.length;u++)i=a[u],Object.prototype.hasOwnProperty.call(o,i)&&o[i]&&d.push(o[i][0]),o[i]=0;for(r in c)Object.prototype.hasOwnProperty.call(c,r)&&(e[r]=c[r]);for(h&&h(t);d.length;)d.shift()();return s.push.apply(s,l||[]),n()}function n(){for(var e,t=0;t<s.length;t++){for(var n=s[t],r=!0,a=1;a<n.length;a++){var c=n[a];0!==o[c]&&(r=!1)}r&&(s.splice(t--,1),e=i(i.s=n[0]))}return e}var r={},o={0:0},s=[];function i(t){if(r[t])return r[t].exports;var n=r[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,i),n.l=!0,n.exports}i.m=e,i.c=r,i.d=function(e,t,n){i.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},i.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,t){if(1&t&&(e=i(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(i.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)i.d(n,r,function(t){return e[t]}.bind(null,r));return n},i.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="";var a=window.webpackJsonp=window.webpackJsonp||[],c=a.push.bind(a);a.push=t,a=a.slice();for(var l=0;l<a.length;l++)t(a[l]);var h=c;s.push([16,1]),n()}({10:function(e,t,n){var r=n(1),o=n(11);"string"==typeof(o=o.__esModule?o.default:o)&&(o=[[e.i,o,""]]);var s={insert:"head",singleton:!1};r(o,s);e.exports=o.locals||{}},11:function(e,t,n){(t=n(2)(!1)).push([e.i,"body {\n  font-family: 'Open Sans';\n  margin: 0;\n  padding: 0;\n}\n\n#documentation {\n  margin-left: 16px;\n}\n\n#documentation,\nbutton {\n  font-size: 16px;\n}\n\ncanvas {\n  display: block;\n  margin: 0 auto;\n}\n\nh1, h3 {\n  margin: 8px 0;\n  padding: 0;\n  text-align: center;\n}\n\n#sensors {\n  text-align: center;\n}\n\n#sensors > h3 {\n  display: inline-block;\n}\n\n#sensors > label,\n.sensor-section > label {\n  border: 1px solid #000000;\n  margin-left: 16px;\n}\n\n#sensors > div {\n  display: flex;\n  justify-content: space-around;\n}\n\n.sensor-section > h4 {\n  display: inline-block;\n  margin: 8px 0;\n}\n\n.sensor-section > div {\n  display: flex;\n  grid-gap: 8px;\n}\n\n.sensor {\n  cursor: pointer;\n  border: 1px solid #000000;\n}\n\n.sensor.active,\n.sensor.active input {\n  background-color: #FED8B1;\n}\n\n.sensor > span {\n  margin: 0 8px;\n}\n\n.sensor > input {\n  cursor: pointer;\n  text-align: right;\n}\n\ninput {\n  font-size: 16px;\n\twidth: 30px;\n}\n\n#controls {\n  margin: 8px 0;\n  text-align: center;\n}",""]),e.exports=t},16:function(e,t,n){"use strict";n.r(t);var r=n(4),o=n.n(r),s=(n(5),n(6),n(8),n(3)),i=n.n(s),a=n(0),c=n.n(a);class l{constructor(e){this.canvas=e,this.context=e.getContext("2d")}clear(){this.context.clearRect(0,0,this.canvas.width,this.canvas.height)}draw(e){let t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];return Array.isArray(e)||(e=[e]),e.forEach(e=>{const{points:n}=e.polygon;let r=n.length-1;for(this.context.save(),this.context.translate(e.polygon.pos.x,e.polygon.pos.y),this.context.beginPath(),this.context.moveTo(n[0].x,n[0].y);r;)this.context.lineTo(n[r].x,n[r].y),r-=1;this.context.closePath(),t?(this.context.fillStyle=e.color,this.context.fill()):(this.context.strokeStyle=e.color,this.context.lineWidth=5,this.context.stroke()),this.context.restore()}),!0}checkCollisions(e,t){const n=[];for(let r=e.length-1;r>=0;r-=1){const o=e[r];for(let s=r-1;s>=0;s-=1){const r=e[s];if(c.a.testPolygonPolygon(o.polygon,r.polygon)&&(n.push([o,r]),!t))return n[0]}}return n}}var h={ANGLE_TO_SPEED_RATIO:60,BRAIN_TICKS_PER_SECOND:10,CANVAS_HEIGHT:300,CANVAS_WIDTH:1280,CAR_HEIGHT:100,CAR_WIDTH:200,COLORS:{asphalt:"#282B2A",generic:["#F7DBD7","#CBBFB0","#FAEACB","#BDC2C2","#739194","#88BCE8","#9CC0E7","#FCFCFC"],goalArea:"#FFD700",player:"#DB2929",sensor:"#EEEEEE"},FRAMES_PER_SECOND:24,LS_CODE_KEY:"parkit_usercode",MAX_ANGLE_THRESHOLD:35,MAX_ANGLE_CHANGE_PER_TICK:5,MAX_SPEED_CHANGE_PER_TICK:.6,PIXELS_PER_METER:10,SENSOR_BREAKPOINTS_QT:70,SENSOR_METERS_RANGE:7,SENSORS_QT:20,SENSOR_RANGE:70,SPEED_RATIO:60};function u(){const e=document.querySelectorAll(".sensor-section"),t=document.querySelectorAll(".sensor.active"),n=h.SENSORS_QT/e.length,r=document.querySelector("#highlight-all-sensors");e.forEach(e=>{const t=e.querySelectorAll(".sensor.active");e.querySelector("input").checked=t.length===n}),r.checked=t.length===h.SENSORS_QT}function d(e,t){t?(e.classList.add("active"),e.setAttribute("data-active",!0)):(e.classList.remove("active"),e.removeAttribute("data-active")),u()}var g={checkSensorsHighlighted:u,createSensorInputs:function(e){const t=[document.querySelector("#front-right-section > div"),document.querySelector("#rear-right-section > div"),document.querySelector("#rear-left-section > div"),document.querySelector("#front-left-section > div")];for(let n=1;n<=e;n+=1){const e=document.createElement("div"),r=document.createElement("span"),o=document.createElement("input");let s=t[Math.floor((n-1)/5)];r.textContent=n,o.setAttribute("readonly",!0),o.setAttribute("type","text"),o.setAttribute("id","sensor".concat(n)),e.classList.add("sensor"),e.setAttribute("data-id",n),e.append(r),e.append(o),e.addEventListener("click",t=>{t.stopPropagation();const n=e.dataset.active;d(e,!n)}),s||(s=t[t.length-1]),s.append(e)}},loadCode:function(){const e=localStorage.getItem(h.LS_CODE_KEY);return e||null},saveCode:function(e){return!!e&&(localStorage.setItem(h.LS_CODE_KEY,e),!0)},setHighlightSensor:d,toggleHighlightSection:function(e){const t=e.target.parentElement.parentElement,n=e.target.checked;t.querySelectorAll(".sensor").forEach(e=>{d(e,n)})},toggleHighlightSensors:function(e){const t=e.target.checked;document.querySelectorAll(".sensor").forEach(e=>{d(e,t)})},updateSensorsDisplay:function(e){Object.keys(e).forEach(t=>{document.querySelector("#sensor".concat(t)).value=e[t].reading})}};var p={degreesToRadians:function(e){return e*(Math.PI/180)}};class y{constructor(e,t,n,r,o){this.area=this.getSensorArea(e,t,n,r,o),this.reading=o}getSensorArea(e,t,n,r,o){const s=r/o,i=[];for(let r=0;r<o;r+=1){const o=r*s;i.push(new c.a.Vector(Math.floor(e-o*Math.cos(p.degreesToRadians(n))),Math.floor(t-o*Math.sin(p.degreesToRadians(n)))))}return i}updateReading(e){this.reading=this.area.length,e.some(e=>this.area.some((t,n)=>!!c.a.pointInPolygon(t,e.polygon)&&(this.reading=n,!0)))}}class S{constructor(e,t,n,r,o,s){this.x=e,this.y=t,this.width=n,this.height=r,this.angle=o,this.color=s,this.polygon=new c.a.Polygon(new c.a.Vector(e,t),[new c.a.Vector(0,0),new c.a.Vector(n,0),new c.a.Vector(n,r),new c.a.Vector(0,r)],n,r)}testInsideAnotherObject(e){const t=this.x,n=this.x+this.width,r=this.y,o=this.y+this.height,s=e.x,i=e.x+e.width,a=e.y,c=e.y+e.height;return t>=s&&n<=i&&r>=a&&o<=c}}class f extends S{constructor(e,t,n,r,o,s,i,a,c,l,h,u){super(t,n,r,o,s,e),this.brainState=i,this.sensorBreakpointQt=u,this.sensorRange=h,this.speed=a,this.parkingBreak=c,l&&(this.sensors=this.buildSensors())}buildSensors(){const e=this.polygon.points.map(e=>({x:this.polygon.pos.x+e.x,y:this.polygon.pos.y+e.y})),t=[-45,0,45,90,135,45,90,135,180,225,135,180,225,270,315,-135,-90,-45,0,45],n={},r=t.length/e.length;for(let o=0;o<t.length;o+=1){const s=e[Math.floor((o||1)/r)];n[o+1]=new y(s.x,s.y,t[o]+this.angle,this.sensorRange,this.sensorBreakpointQt)}return n}updateSensors(e){Object.keys(this.sensors).forEach(t=>this.sensors[t].updateReading(e))}proccessCarBrainAngle(){const e=this.brainState.angle;let t=0;if(this.angle!==e){const n=e-this.angle;n>0?t=Math.min(n,h.MAX_ANGLE_CHANGE_PER_TICK):n<0&&(t=Math.max(n,-h.MAX_ANGLE_CHANGE_PER_TICK)),t*=this.speed/h.ANGLE_TO_SPEED_RATIO}return this.angle+=t,t}proccessCarBrainSpeed(){let e=this.brainState.speed,t=0;if(this.parkingBreak&&(e=0),this.speed!==e){const n=e-this.speed;n>0?t=Math.min(n,h.MAX_SPEED_CHANGE_PER_TICK):n<0&&(t=Math.max(n,-h.MAX_SPEED_CHANGE_PER_TICK))}return this.speed+=t,t}update(){this.proccessCarBrainSpeed();const e=this.speed*(Math.abs(this.speed)/h.SPEED_RATIO),t=this.proccessCarBrainAngle();if(!e)return;const n=p.degreesToRadians(this.angle),r=p.degreesToRadians(t);this.x-=e*Math.cos(n),this.y-=e*Math.sin(n),this.polygon.pos.x=this.x,this.polygon.pos.y=this.y;const o=this.polygon.points.map(e=>{const t=e.x-.25*this.width,n=e.y-.5*this.height,o=t*Math.cos(r)-n*Math.sin(r),s=t*Math.sin(r)+n*Math.cos(r);return new c.a.Vector(o+.25*this.width,s+.5*this.height)});this.polygon.setPoints(o)}}class E{constructor(e,t,n,r,o,s){this.player=e,this.objects=t,this.ground=n,this.goalArea=r,this.limits=o,this.goalReachedAction=s}checkGoal(){return this.player.testInsideAnotherObject(this.goalArea)}}var v={getLevel:function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:h.COLORS,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:h.CAR_WIDTH,r=arguments.length>3&&void 0!==arguments[3]?arguments[3]:h.CAR_HEIGHT,o=arguments.length>4&&void 0!==arguments[4]?arguments[4]:h.CANVAS_WIDTH,s=arguments.length>5&&void 0!==arguments[5]?arguments[5]:h.CANVAS_HEIGHT,a=arguments.length>6&&void 0!==arguments[6]?arguments[6]:h.SENSOR_RANGE,c=arguments.length>7&&void 0!==arguments[7]?arguments[7]:h.SENSOR_BREAKPOINTS_QT;switch(e){case 1:return new E(new f(t.player,o-(n+10),r+60,n,r,0,{angle:0,speed:0,memory:{}},0,!1,!0,a,c),[new f(t.generic[0],10,10,n,r),new f(t.generic[1],2*n+128,10,n,r),new f(t.generic[2],3*n+192,10,n,r),new f(t.generic[3],4*n+256,10,n,r)],new S(0,0,o,s,0,t.asphalt),new S(n+25,5,n+90,r+10,0,t.goalArea),[new S(-1,-2,o+2,1),new S(-1,s+1,o+2,1),new S(-2,0,1,s),new S(o+1,0,1,s)],()=>{new i.a({text:"You reached the goal!",type:"success"}).show(),gtag("event","won",{event_category:"play",event_label:"level_1"})});default:return null}}};var _={drawSensors:function(e,t){const n=document.querySelector("canvas").getContext("2d");n.strokeStyle=h.COLORS.sensor,n.lineWidth=2,e.forEach(e=>{const{area:r}=t.sensors[e];n.beginPath(),n.moveTo(r[0].x,r[0].y),n.lineTo(r[r.length-1].x,r[r.length-1].y),n.closePath(),n.stroke()}),n.restore()}};n(10),n(12),n(14);function A(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function m(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?A(Object(n),!0).forEach((function(t){b(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):A(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function b(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}let x,O,w;function C(e,t){const{goalArea:n,ground:r,player:o,objects:s,limits:a,goalReachedAction:c}=t,l=document.querySelectorAll(".sensor.active");let h=null;if(e.clear(),e.draw([r,...s,o]),e.draw(n,!1),o.parkingBreak&&t.checkGoal())return T(!1,!1),void c();if(o.update(),o.sensors=o.buildSensors(),l.length){const e=[];l.forEach(t=>e.push(parseInt(t.dataset.id,10))),_.drawSensors(e,o)}h=e.checkCollisions([...s,o,...a]),h.length&&(T(!1),new i.a({text:"Your car crashed!",type:"error"}).show())}function R(e,t,n){const r=x.getValue(),o={sensors:e.sensors,memory:e.brainState.memory};let s=null;e.updateSensors([...t,...n]),g.updateSensorsDisplay(e.sensors),eval.call({},"(".concat(r,")"))(o),s=m(m({},e.brainState),o),s.angle>0?s.angle=Math.min(s.angle,h.MAX_ANGLE_THRESHOLD):s.angle<0&&(s.angle=Math.max(s.angle,-h.MAX_ANGLE_THRESHOLD)),s.sensors=e.sensors,e.brainState=s,e.parkingBreak=s.parkingBreak}function T(e){let t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];const n=v.getLevel(1),r=document.querySelector("canvas"),o=new l(r),{objects:s,player:i,limits:a}=n;e&&!O?(O=setInterval(()=>C(o,n),1e3/h.FRAMES_PER_SECOND),w=setInterval(()=>R(i,s,a),1e3/h.BRAIN_TICKS_PER_SECOND)):e||(clearInterval(O),clearInterval(w),O=null,w=null,t&&C(o,n))}i.a.overrideDefaults({layout:"center",theme:"metroui",timeout:3e3}),window.onload=()=>{const e=document.querySelector("canvas");e.width=h.CANVAS_WIDTH,e.height=h.CANVAS_HEIGHT,g.createSensorInputs(h.SENSORS_QT),x=o.a.fromTextArea(document.querySelector("#code-editor"),{lineNumbers:!0,mode:"javascript",theme:"paraiso-dark"});const t=document.querySelector(".CodeMirror"),n=t.getClientRects()[0].top,r=window.innerHeight-n,s=g.loadCode();t.style.height="".concat(r,"px"),s?x.setValue(s):x.getDoc().setValue("function carBrain(car) {\n  car.speed = 20;\n\n  if (car.sensors[3].reading === 10 && car.sensors[4].reading === 10) {\n    car.speed = 0;\n  } else if (car.sensors[3].reading >= 6) {\n    car.angle = 5;\n  } else if (car.sensors[3].reading <= 4) {\n    car.angle = -5;\n  }\n}"),T(!1),document.querySelector("#play").addEventListener("click",()=>T(!0)),document.querySelector("#stop").addEventListener("click",()=>T(!1)),document.querySelector("#save").addEventListener("click",()=>g.saveCode(x.getValue())),document.querySelector("#highlight-all-sensors").addEventListener("change",g.toggleHighlightSensors),document.querySelectorAll(".sensor-section").forEach(e=>{const t=e.querySelector("input");e.addEventListener("change",g.toggleHighlightSection),t.checked=!1}),document.querySelector("#highlight-all-sensors").checked=!1}}});
//# sourceMappingURL=main.fce94495.js.map