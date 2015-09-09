(function () {
    'use strict';

    var scripts = document.getElementsByTagName("script");
    var currentScriptPath = scripts[scripts.length - 1].src;
    var basePath = currentScriptPath.substring(0, currentScriptPath.lastIndexOf('/') + 1) + '..';
    var baseURL = 'http://www.freetts.com/api';

    angular.module('textToSpeech', ['session'])
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
        .directive('textToSpeech', ['$compile', '$timeout', '$tts', '$session', '$notice', function ($compile, $timeout, $tts, $session, $notice) {
            return {
                restrict: 'A',
                replace: true,
                require: 'ngModel',
                scope: {text: '@'},
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
                    $scope.settings = {};

                    $scope.init = function () {
                        $scope.settings.show_all = $session.cookie('tts_show_all') === 'true';

                        $scope.$watch('settings', function () {
                            $session.cookie('tts_lang', $scope.settings.lang, 365);
                            $session.cookie('tts_show_all', $scope.settings.show_all, 365);
                        }, true);

                        $tts.getVoices().then(function (voices) {
                            if (voices && voices.length > 0) {
                                $scope.voices = voices;
                                $scope.settings.lang = $session.cookie('tts_lang') || 'English, Britain';
                            }
                        });
                    };

                    $scope.langFilter = function (value, index, array) {
                        return $scope.settings.show_all || /english/i.test(value);
                    };

                    $scope.createTTS = function () {
                        $scope.sound = null;
                        $scope.loading = true;

                        $.getJSON(baseURL + '/generate?voice=' + encodeURIComponent($scope.settings.lang) + '&text=' + encodeURIComponent($scope.text) + '&callback=?', function (obj) {
                            if (!obj.url) {
                                $notice.error('The sound file could not be generated at this time. Please try selecting a different voice and try again.');
                            } else {
                                $scope.sound = obj.url;
                            }

                            $timeout(function () { $scope.loading = false; });
                        });
                    };

                    $timeout($scope.init);
                }
            };
        }]);
})();


