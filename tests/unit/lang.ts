/// <reference path="../intern.d.ts" />

import assert = require('intern/chai!assert');
import lang = require('../../lang');
import registerSuite = require('intern!object');

var global:any = (function () {
	return this;
})();

interface IExtraProps extends IProps {
	newProperty:string;
}

interface IProps {
	property:string;
	subObject:ISubObject;
	method():void;
}

interface ISpy {
	(...args:any[]):any;
	args:any[];
}

interface ISubObject {
	property:string;
	otherProperty?:string;
}

registerSuite({
	name: 'lang',

	'.getProperty': function () {
		var properties = {
			property: 'foo',
			subObject: {
				property: 'bar'
			}
		};

		assert.strictEqual(lang.getProperty(properties, 'property'), 'foo');
		assert.strictEqual(lang.getProperty(properties, 'subObject.property'), 'bar');
	},

	'.setProperty': function () {
		var properties = {
			property: 'foo',
			subObject: {
				property: 'bar'
			}
		};

		lang.setProperty(properties, 'property', 'baz');
		assert.propertyVal(properties, 'property', 'baz');
		lang.setProperty(properties, 'subObject.property', 'blah');
		assert.deepPropertyVal(properties, 'subObject.property', 'blah');
	},

	'.mixin': function () {
		assert.typeOf(lang.mixin(null), 'object');
		assert.typeOf(lang.mixin(undefined), 'object');

		var properties = {
			property: 'bar',
			subObject: {
				property: 'baz'
			},
			method: function () {}
		};
		var dest:IProps = lang.mixin<IProps>({}, properties);
		assert.deepEqual(dest, properties);
		assert.deepEqual(dest.subObject, properties.subObject);

		var extra:IExtraProps = lang.mixin<IExtraProps>({}, properties, {
			property: 'blah',
			newProperty: 'foo'
		});
		assert.strictEqual(extra.property, 'blah');
		assert.strictEqual(extra.newProperty, 'foo');
	},

	'.delegate': function () {
		var src:IProps = {
			property: 'bar',
			subObject: {
				property: 'baz'
			},
			method: function () {}
		};

		var dest:IExtraProps = lang.delegate<IExtraProps>(src, { newProperty: 'bar' });

		assert.strictEqual(dest.property, src.property);
		assert.strictEqual(dest.subObject, src.subObject);
		assert.strictEqual(dest.method, src.method);
		assert.strictEqual(dest.newProperty, 'bar');
		assert(!dest.hasOwnProperty('property'));
		assert(dest.hasOwnProperty('newProperty'));
	},

	'.bind': {
		before: function () {
			global.someProperty = 'bar';
		},

		after: function () {
			global.someProperty = null;
		},

		'object': function () {
			var context = {
				someProperty: 'foo'
			};

			var unbound = function () {
				assert.strictEqual(this.someProperty, 'foo');
			};

			var bound = lang.bind<() => void>(context, unbound);

			assert.notStrictEqual(bound, unbound);
			bound();
			bound.call({});
		},

		'null': function () {
			var unbound = function () {
				assert.strictEqual(this, global);
			};

			var bound = lang.bind<() => void>(null, unbound);

			assert.notStrictEqual(bound, unbound);
			bound();
			bound.call({});
		},

		'arguments': function () {
			var context = {
				someProperty: 'foo'
			};

			var unbound = function (variable:string) {
				assert.strictEqual(this.someProperty, 'foo');
				assert.strictEqual(variable, 'bar');
			};

			var bound = lang.bind<() => void>(context, unbound, 'bar');

			assert.notStrictEqual(bound, unbound);
			bound();
			bound.call({});
		},

		'late binding': {
			'object': function () {
				var context = {
					someProperty: 'foo',
					method: function () {
						assert.strictEqual(this.someProperty, 'foo');
					}
				};

				var bound = lang.bind<() => void>(context, 'method');

				assert.notStrictEqual(bound, context.method);
				bound();
				bound.call({});
			},

			'arguments': function () {
				var context = {
					someProperty: 'foo',
					method: function (variable:string) {
						assert.strictEqual(this.someProperty, 'foo');
						assert.strictEqual(variable, 'bar');
					}
				};

				var bound = lang.bind<() => void>(context, 'method', 'bar');

				assert.notStrictEqual(bound, context.method);
				bound();
				bound.call({});
			}
		}
	},

	'.partial': function () {
		var f = <ISpy>function () {
			f.args = arguments;
		};

		var partial1 = lang.partial<(a:string, b:string) => void>(f, 'foo');

		partial1('bar', 'baz');
		assert.deepEqual(f.args, [ 'foo', 'bar', 'baz' ]);

		var partial2 = lang.partial<(a:string) => void>(f, 'foo', 'bar');
		partial2('baz');
		assert.deepEqual(f.args, [ 'foo', 'bar', 'baz' ]);
	},

	'.deepMixin': function () {
		var properties = {
			property: 'bar',
			subObject: {
				property: 'baz'
			},
			method: function () {}
		};
		var dest:IProps = lang.deepMixin<IProps>({}, properties);
		assert.deepEqual(dest, properties);
		assert.notStrictEqual(dest.subObject, properties.subObject);

		var extra:IExtraProps = lang.deepMixin<IExtraProps>(dest, {
			property: 'blah',
			newProperty: 'foo',
			subObject: {
				otherProperty: 'la'
			}
		});
		assert.strictEqual(extra.property, 'blah');
		assert.strictEqual(extra.newProperty, 'foo');
		assert.notStrictEqual(extra.subObject, properties.subObject);
		assert.strictEqual(extra.subObject.property, 'baz');
		assert.strictEqual(extra.subObject.otherProperty, 'la');
	},

	'.deepDelegate': function () {
		var properties:IProps = {
			property: 'bar',
			subObject: {
				property: 'baz'
			},
			method: function () {}
		};
		var dest:IExtraProps = lang.deepDelegate<IExtraProps>(properties, {
			newProperty: 'foo',
			subObject: {
				otherProperty: 'la'
			}
		});
		assert.strictEqual(dest.property, properties.property);
		assert.strictEqual(dest.newProperty, 'foo');
		assert.strictEqual(dest.method, properties.method);
		assert.notStrictEqual(dest.subObject, properties.subObject);
		assert.strictEqual(dest.subObject.property, properties.subObject.property);
		assert.strictEqual(dest.subObject.otherProperty, 'la');
		assert(dest.hasOwnProperty('newProperty'));
		assert(!dest.hasOwnProperty('property'));
		assert(dest.subObject.hasOwnProperty('otherProperty'));
		assert(!dest.subObject.hasOwnProperty('property'));
	}
});
