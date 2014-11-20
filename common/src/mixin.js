/*
 * mixin.js
 *
 * Basic streamline mixin functionality
 */

function mixin(dest, source) {
	var keys = Object.keys(source);
	for(var i=0; i<keys.length; i++) {
		var key = keys[i];
		if(Array.isArray(source[key]) ) {
			dest[key] = dest[key] || [];
			dest[key] = dest[keys[i]].concat(source[key]);
		} else if (typeof source[key]==="object" ) {
			dest[key] = dest[key] || {};
			dest[key] = mixin(dest[key], source[key]);
		} else {
			dest[keys[i]] = source[keys[i]];			
		}
	}
	return dest;
};

module.exports = function(source1, source2) {
	var dest = mixin({}, source1);
	return mixin(dest, source2);
};
