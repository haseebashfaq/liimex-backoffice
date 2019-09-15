/*
* This Directive is called using convert-to-number
* and is used to conver string to int type
*/
angular.module('application').directive("lmxInlineDropdown", function($timeout, $document) {
    return {
        link: {
            pre: function(scope, elem, attr) {
                const property = String(attr.property).slice(1, -1);
                const value = property ? 'value.' + property : 'value';
                scope.expression = 'key as ' + value + ' for (key, value) in options';
            },
            post: function (scope, element, attr) {

                function startEditing() {
                    if (scope.disabled) return;
                    scope.$apply(() => {
                        scope.mode = scope.mode === 'edit' ? 'view' : 'edit';
                        if (scope.mode === 'edit') {
                            $timeout(() => {
                                element.find('select').focus();
                            });
                        }
                    });
                    $document.bind('mouseup', () => {
                        scope.select();
                    });
                }

                element.on('mouseup', event => {
                    if (scope.mode === 'edit') {
                        event.stopPropagation();
                    }
                });

                element.on('dblclick', event => {
                    event.stopPropagation();
                    startEditing();
                });

                element.find('.focus-catcher').focus(event =>{
                    startEditing()
                });

                element.find('select').on('blur', event => {
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

           $scope.select = function() {
               $document.unbind('mouseup');
               $document.unbind('keydown');
               $scope.mode = 'view';
               $scope.safeApply();


               if ($scope.initialValue === $scope.selected) {
                   return;
               }

               if (typeof $scope.onChange === 'function') {
                   $scope.startProcessing();
                   $scope.onChange($scope.identity, $scope.selected, $scope.endProcessing);
               }
           };
        }],
        restrict: 'E',
        scope: {
            selected: '=',
            options: '=',
            disabled: '=',
            property: '=',
            identity: '=',
            onChange: '='
        },
        templateUrl: 'partials/lmx_directives/lmx_inline_dropdown.html'
    };
});
