angular.module('application').config(['dynamicNumberStrategyProvider', function(dynamicNumberStrategyProvider){
    dynamicNumberStrategyProvider.addStrategy('euro', {
        numInt: 8,
        numFract: 2,
        numSep: ',',
        numPos: true,
        numNeg: false,
        numRound: 'round',
        numThousand: true,
        numPrepend: '€'
    });
    dynamicNumberStrategyProvider.addStrategy('percent', {
        numInt: 8,
        numFract: 2,
        numSep: ',',
        numPos: true,
        numNeg: false,
        numRound: 'round',
        numThousand: true,
        numAppend: '%'
    });
    dynamicNumberStrategyProvider.addStrategy('multiply', {
        numInt: 8,
        numFract: 0,
        numPos: true,
        numNeg: false,
        numRound: 'round',
        numThousand: true,
        numPrepend: '×'
    });
}]);

angular.module('application').directive("lmxInlineInput", function($timeout, $document, $rootScope) {
    const ENTER_KEY = 13;
    const ESCAPE_KEY = 27;
    const DEFAULT_CAPTION = 'Double click to edit';
    return {
        link: {
            post: function (scope, element, attr) {

                function startEditing() {
                    if (scope.disabled || scope.unclickable) return;
                    $rootScope.inline_editing = true;
                    scope.$apply(() => {
                        scope.mode = scope.mode === 'edit' ? 'view' : 'edit';
                        if (scope.mode === 'edit') {
                            $timeout(() => {
                                element.find('input').focus();
                            });
                        }
                    });
                    $document.bind('mouseup', () => {
                        scope.finishEditing();
                    });

                    $document.bind('keydown', event => {
                       if (event.which === ENTER_KEY) {
                           scope.finishEditing();
                       }
                       if (event.which === ESCAPE_KEY) {
                           scope.finishEditing(true);
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
                    startEditing()
                });

                element.on('click', event => {
                   // if (scope.mode !== 'edit' && $rootScope.inline_editing === true)
                });

                element.find('.focus-catcher').focus(event =>{
                    startEditing()
                });

                element.find('input').on('focusout', event => {
                    scope.finishEditing();
                });
            }
        },
        controller: ['$scope', function LmxInlineInputController($scope){
            $scope.initialValue = $scope.value;

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

            $scope.finishEditing = function(suppressed) {
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

            $scope.getCaption = function() {
                if ($scope.value == null) return $scope.emptyCaption || DEFAULT_CAPTION;
                return $scope.value;
            };

            $scope.rightIconClick = function() {
                if (typeof $scope.onRightIcon === 'function') {
                    $scope.startProcessing();
                    $scope.onRightIcon($scope.identity, $scope.value, $scope.rightKey, () => {
                        $scope.processing = false;
                    })
                }
            };
        }],
        restrict: 'E',
        scope: {
            value: '=',
            identity: '=',
            disabled: '=',
            unclickable: '=',
            onChange: '=',
            emptyCaption: '=',
            applyFilter: '=',
            applyValidation: '=',
            placeholder: '=',
            onRightIcon: '=',
            rightCaption: '=',
            rightFa: '=',
            rightKey: '='
        },
        templateUrl: 'partials/lmx_directives/lmx_inline_input.html'
    };
});
