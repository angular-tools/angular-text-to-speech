(function () {
    'use strict';

    var scripts = document.getElementsByTagName("script");
    var currentScriptPath = scripts[scripts.length - 1].src;
    var basePath = currentScriptPath.substring(0, currentScriptPath.lastIndexOf('/') + 1) + '..';
    var baseURL = 'http://www.freetts.com/api';

    angular.module('textToSpeech', [])
        .factory('$tts', ['$q', '$timeout', function ($q, $timeout) {
            var ttsService = {};
            var voices = [];

            ttsService.getVoices = function () {
                var deferred = $q.defer();

                if (voices.length > 0) {
                    $timeout(function () { deferred.resolve(voices); });
                } else {
                    $.getJSON(baseURL + '/voices?type=free&callback=?', function (obj) {
                        voices = obj.voices;
                        $timeout(function () { deferred.resolve(voices); });
                    });
                }

                return deferred.promise;
            };

            return ttsService;
        }])
        .directive('textToSpeech', ['$compile', '$timeout', '$tts', function ($compile, $timeout, $tts) {
            return {
                restrict: 'A',
                replace: true,
                require: 'ngModel',
                scope: {voice: '=', text: '@', sound: '='},
                templateUrl: basePath + '/templates/text-to-speech.html',
                link: function ($scope, element, attrs, ngModel) {
                    $scope.init = function () {
                        $scope.sound = ngModel.$viewValue;
                        $scope.$watch('sound', function () {
                            ngModel.$setViewValue($scope.sound);
                        });
                    };

                    ngModel.$render = $scope.init;
                },
                controller: function ($scope, $element) {
                    $scope.init = function () {
                        $tts.getVoices().then(function (voices) {
                            $scope.voices = voices;
                            $scope.voice = voices[0].id;
                        });
                    };

                    $scope.createTTS = function () {
                        $scope.sound = null;
                        $scope.loading = true;

                        $.getJSON(baseURL + '/generate?voice=' + escape($scope.voice) + '&text=' + escape($scope.text) + '&callback=?', function (obj) {
                            $timeout(function () {
                                $scope.sound = obj.url;
                                $scope.loading = false;
                            });
                        });
                    };

                    $scope.init();
                }
            };
        }]);
})();


