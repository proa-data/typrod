angular
	.module('tpd')
	.directive('tpdData', tpdDataCompile)
	.directive('tpdData', tpdDataLink); // To get scope of "ngRepeat"

function tpdDataCompile(tpd, tpdToString) {
	return {
		restrict: 'A',
		compile: compile,
		priority: 1010 // Executed before directive "ngRepeat" and other custom ones
	};

	function compile(element) {
		var component = getComponentByElem(tpd, element);
		if (!component)
			return;

		element = $(element);

		var content = component[0];
		content = tpdToString(content, element.get(0));

		var ATTR_CONTENT = '$tpdProp in $$tpdData';
		element.html(
			$('<div>')
				.html(content)
				.find('[tpd-prop]')
					.attr('ng-repeat', ATTR_CONTENT)
				.end()
				.find('[tpd-prop-start]')
					.attr('ng-repeat-start', ATTR_CONTENT)
				.end()
				.find('[tpd-prop-end]')
					.attr('ng-repeat-end', '')
				.end()
				.html()
		);
	}
}

function tpdDataLink(tpd, $sce, tpdUtils) {
	return {
		restrict: 'A',
		scope: true,
		link: link
	};

	function link(scope, element, attrs) {
		var component = getComponentByElem(tpd, element);
		if (!component)
			return;

		var data = angular.copy(scope.$eval(attrs[this.name])),
			values = scope.$eval(attrs.tpdValues);
		angular.forEach(data, function (property, i) {
			if (angular.isArray(property)) {
				var keys = ['name', 'label', 'required', 'type'],
					obj = {};
				angular.forEach(keys, function (key, j) {
					obj[key] = property[j];
				});
				data[i] = property = angular.merge(obj, property[keys.length]);
			}

			property.type = property.type || 'string';
			property.label = $sce.trustAsHtml(property.label);
			if (values) {
				var NAME = property.name;
				scope.$watch(function () {
					return values[NAME];
				}, function (value) {
					property.value = tpdUtils.getTypeByProp(property).fromJson(value);
				});
				scope.$watch(function () {
					return property.value;
				}, function (value) {
					values[NAME] = tpdUtils.getTypeByProp(property).toJson(value);
				});
			}
		});
		scope.$$tpdData = data;

		scope.$$tpdEc = component[1];
	}
}

function getComponentByElem(tpd, elem) {
	var matches = [];

	elem = $(elem);
	angular.forEach(tpd.components(), function (component) {
		var selector = component.selector;
		if (elem.is(selector))
			matches.push({
				selector: selector,
				args: [component.content, component.ec]
			});
	});

	if (matches.length == 1)
		return matches[0].args;

	var selector,
		args;
	angular.forEach(matches, function (match) {
		if (!selector || SPECIFICITY.compare(selector, match.selector) < 0) {
			selector = match.selector;
			args = match.args;
		}
	});
	return args;
}