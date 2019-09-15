angular.module('application').directive("lmxInlineHtml", function($timeout, $document) {
    const WARNING_CLASS = 'warning-class';
    const ENTER_KEY = 13;
    const ESCAPE_KEY = 27;
    return {
        link: {
            post: function (scope, element, attr) {

                function toggleEditing() {
                    scope.$apply(() => {
                        scope.mode = scope.mode === 'edit' ? 'view' : 'edit';
                        if (scope.mode === 'edit') {
                            $timeout(() => {
                                element.find('input').focus();
                            });
                        }
                    });
                    $document.bind('mouseup', () => {
                        scope.select();
                    });

                    $document.bind('keydown', event => {
                        if (event.which === ENTER_KEY) {
                            scope.select();
                        }
                        if (event.which === ESCAPE_KEY) {
                            scope.select(true);
                        }
                    });
                }

                element.on('mouseup', event => {
                    if (scope.mode === 'edit') {
                        event.stopPropagation();
                    }
                });

                element.on('dblclick', event => {
                    event.stopPropagation();
                    toggleEditing()
                });

                element.find('.focus-catcher').focus(event =>{
                    toggleEditing()
                });

                element.find('input').on('focusout', event => {
                    scope.select();
                });
            }
        },
        controller: ['$scope', function LmxInlineDropdownController($scope){
            $scope.initialValue = $scope.value;

            $scope.startProcessing = function() {
                $scope.processing = true;
            };

            $scope.endProcessing = function(err, updatedValue) {
                $scope.processing = false;
                if (err) {
                    $scope.value = $scope.initialValue;
                    return;
                }
                $scope.initialValue = updatedValue || $scope.value;
            };

            $scope.safeApply = function(fn) {
                if(!this.$root){
                    return;
                }
                const phase = this.$root.$$phase;
                if (phase === '$apply' || phase === '$digest') {
                    if (fn && typeof fn === 'function') {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };

            $scope.select = function(suppressed) {
                $document.unbind('mouseup');
                $document.unbind('keydown');
                $scope.mode = 'view';
                $scope.safeApply();

                if ($scope.initialValue === $scope.value) {
                    return;
                }

                if (suppressed) {
                    $scope.value = $scope.initialValue;
                    return;
                }

                if (typeof $scope.onChange === 'function') {
                    $scope.startProcessing();
                    $scope.onChange($scope.identity, $scope.value, $scope.endProcessing);
                }
            };
        }],
        restrict: 'E',
        scope: {
            value: '=',
            identity: '=',
            onChange: '=',
            applyFilter: '=',
            applyValidation: '=',
            placeholder: '='
        },
        templateUrl: 'partials/lmx_directives/lmx_inline_input.html'
    };
});
