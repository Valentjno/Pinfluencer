var app = angular.module('Pinfluencer');

app.config(function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/home');

  $stateProvider
    .state('/', {
      url: '/home',
      templateUrl: 'partials/home.html',
      controller: 'homeController'
    });
});
