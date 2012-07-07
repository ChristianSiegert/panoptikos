// MooTools: the javascript framework.
// Load this file's selection again by visiting: http://mootools.net/more/b3a45d7b5f809067bb9fc1756c98ea36 
// Or build this file again with packager using: packager build More/Element.Measure More/Request.JSONP
/*
---
copyrights:
  - [MooTools](http://mootools.net)

licenses:
  - [MIT License](http://mootools.net/license.txt)
...
*/
MooTools.More={version:"1.4.0.1",build:"a4244edf2aa97ac8a196fc96082dd35af1abab87"};(function(){var b=function(e,d){var f=[];Object.each(d,function(g){Object.each(g,function(h){e.each(function(i){f.push(i+"-"+h+(i=="border"?"-width":""));
});});});return f;};var c=function(f,e){var d=0;Object.each(e,function(h,g){if(g.test(f)){d=d+h.toInt();}});return d;};var a=function(d){return !!(!d||d.offsetHeight||d.offsetWidth);
};Element.implement({measure:function(h){if(a(this)){return h.call(this);}var g=this.getParent(),e=[];while(!a(g)&&g!=document.body){e.push(g.expose());
g=g.getParent();}var f=this.expose(),d=h.call(this);f();e.each(function(i){i();});return d;},expose:function(){if(this.getStyle("display")!="none"){return function(){};
}var d=this.style.cssText;this.setStyles({display:"block",position:"absolute",visibility:"hidden"});return function(){this.style.cssText=d;}.bind(this);
},getDimensions:function(d){d=Object.merge({computeSize:false},d);var i={x:0,y:0};var h=function(j,e){return(e.computeSize)?j.getComputedSize(e):j.getSize();
};var f=this.getParent("body");if(f&&this.getStyle("display")=="none"){i=this.measure(function(){return h(this,d);});}else{if(f){try{i=h(this,d);}catch(g){}}}return Object.append(i,(i.x||i.x===0)?{width:i.x,height:i.y}:{x:i.width,y:i.height});
},getComputedSize:function(d){d=Object.merge({styles:["padding","border"],planes:{height:["top","bottom"],width:["left","right"]},mode:"both"},d);var g={},e={width:0,height:0},f;
if(d.mode=="vertical"){delete e.width;delete d.planes.width;}else{if(d.mode=="horizontal"){delete e.height;delete d.planes.height;}}b(d.styles,d.planes).each(function(h){g[h]=this.getStyle(h).toInt();
},this);Object.each(d.planes,function(i,h){var k=h.capitalize(),j=this.getStyle(h);if(j=="auto"&&!f){f=this.getDimensions();}j=g[h]=(j=="auto")?f[h]:j.toInt();
e["total"+k]=j;i.each(function(m){var l=c(m,g);e["computed"+m.capitalize()]=l;e["total"+k]+=l;});},this);return Object.append(e,g);}});})();Request.JSONP=new Class({Implements:[Chain,Events,Options],options:{onRequest:function(a){if(this.options.log&&window.console&&console.log){console.log("JSONP retrieving script with url:"+a);
}},onError:function(a){if(this.options.log&&window.console&&console.warn){console.warn("JSONP "+a+" will fail in Internet Explorer, which enforces a 2083 bytes length limit on URIs");
}},url:"",callbackKey:"callback",injectScript:document.head,data:"",link:"ignore",timeout:0,log:false},initialize:function(a){this.setOptions(a);},send:function(c){if(!Request.prototype.check.call(this,c)){return this;
}this.running=true;var d=typeOf(c);if(d=="string"||d=="element"){c={data:c};}c=Object.merge(this.options,c||{});var e=c.data;switch(typeOf(e)){case"element":e=document.id(e).toQueryString();
break;case"object":case"hash":e=Object.toQueryString(e);}var b=this.index=Request.JSONP.counter++;var f=c.url+(c.url.test("\\?")?"&":"?")+(c.callbackKey)+"=Request.JSONP.request_map.request_"+b+(e?"&"+e:"");
if(f.length>2083){this.fireEvent("error",f);}Request.JSONP.request_map["request_"+b]=function(){this.success(arguments,b);}.bind(this);var a=this.getScript(f).inject(c.injectScript);
this.fireEvent("request",[f,a]);if(c.timeout){this.timeout.delay(c.timeout,this);}return this;},getScript:function(a){if(!this.script){this.script=new Element("script",{type:"text/javascript",async:true,src:a});
}return this.script;},success:function(b,a){if(!this.running){return;}this.clear().fireEvent("complete",b).fireEvent("success",b).callChain();},cancel:function(){if(this.running){this.clear().fireEvent("cancel");
}return this;},isRunning:function(){return !!this.running;},clear:function(){this.running=false;if(this.script){this.script.destroy();this.script=null;
}return this;},timeout:function(){if(this.running){this.running=false;this.fireEvent("timeout",[this.script.get("src"),this.script]).fireEvent("failure").cancel();
}return this;}});Request.JSONP.counter=0;Request.JSONP.request_map={};