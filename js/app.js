var app = angular.module('Pinfluencer', [ 'ui.router', 'ui.bootstrap', 'ngAnimate' ]);

window.pAsyncInit = () => {
  PDK.init({
    appId: "APPID",
    cookie: true
  });
};

let access_token = "";
window.onload = () => {

  if (access_token == "") {
    PDK.login({
      scope: "read_public, write_public, read_relationships, write_relationships"
    }, (session) => {
      if (session) {
        access_token = session.accessToken;

        PDK.setSession({
          accessToken: access_token,
          scope: "read_public, write_public, read_relationships, write_relationships"
        });
      }
    });
  }
  else {
    PDK.setSession({
        accessToken: access_token,
        scope: "read_public, write_public, read_relationships, write_relationships",
        fields: "id,username,first_name,last_name,bio,created_at,counts,image"
    });
  }
};

app.controller('homeController', function($scope) {

  let get_yyyymmdd = (d) => {
    let mm = d.getMonth() + 1; // getMonth() is zero-based
    let dd = d.getDate();
  
    return [d.getFullYear(),
            (mm>9 ? '' : '0') + mm,
            (dd>9 ? '' : '0') + dd
           ].join('');
  };

  $scope.debug = true;

  $scope.firstDay = "";
  $scope.lastDay = "";

  $scope.myStorage = window.localStorage;
  $scope.today = new Date();
  $scope.today = get_yyyymmdd($scope.today);

  if ($scope.myStorage.getItem("Pinfluencer") != null) {
    $scope.localData = JSON.parse($scope.myStorage.getItem("Pinfluencer"));
  } else {
    $scope.myStorage["Pinfluencer"] = "";
    $scope.localData = {};
  }

  if ($scope.localData[$scope.today] == null)
    $scope.localData[$scope.today] = {};

  $scope.updateStorage = () => {
    $scope.myStorage["Pinfluencer"] = JSON.stringify($scope.localData);
  };

  $scope.cleanStorage = () => {
    // get last 2 more recent days and clean data
    let keys = Object.keys($scope.localData);
    $scope.firstDay = keys[keys.length-2];
    $scope.lastDay = keys[keys.length-3];
    let firstDay_data = angular.copy($scope.localData[$scope.firstDay]);
    let lastDay_data = angular.copy($scope.localData[$scope.lastDay]);
    let user = angular.copy($scope.localData.user);

    $scope.localData = {};
    if ($scope.firstDay == $scope.today) {
      $scope.localData.user = user;
      $scope.localData[$scope.firstDay] = firstDay_data;
      $scope.localData[$scope.lastDay] = lastDay_data;
    }
    else {
      delete($scope.localData.user);
      $scope.localData[$scope.lastDay] = firstDay_data;
    }
    $scope.updateStorage();
  };
  $scope.cleanStorage();

  console.log($scope.localData);

  $scope.personalData = () => {
    let user=[];

    if ($scope.localData.user == null || $scope.localData.user == "") {

      let params = {
        fields: 'id,username,first_name,last_name,bio,created_at,counts,image'
      };

      PDK.request("/v1/me/", params, (response) => {
        if (!response || response.error) {
          alert('Error occurred');
        } else {
          user = user.concat(response.data);

          $scope.localData.user = user;
          $scope.updateStorage();
        }
      });
    }
  };
  $scope.personalData();

  $scope.refreshToday = () => {
    $scope.localData[$scope.today].followers = null;
    $scope.localData[$scope.today].following = null;

    $scope.getFollowers();
    $scope.getFollowing();
  };

  $scope.getFollowers = () => {
    let users = [];

    if ($scope.localData[$scope.today].followers == null || $scope.localData[$scope.today].followers == "") {

      let params = {
        fields: 'id,username,first_name,last_name,bio,created_at,counts,image'
      };
      
      PDK.request('/v1/me/followers/', params, (response) => {
        if (!response || response.error) {
          alert('Error occurred');  
        } else {
          users = users.concat(response.data);

          if (response.hasNext) {
            response.next();
          }
        }

        $scope.localData[$scope.today].followers = angular.copy(users);
        $scope.updateStorage();
        $scope.refreshTodayData();
      });
    }
  };
  $scope.getFollowers();
  
  $scope.getFollowing = () => {
    let users = [];
    if ($scope.localData[$scope.today].following == null || $scope.localData[$scope.today].following == "") {

      let params = {
        fields: 'id,username,first_name,last_name,bio,created_at,counts,image'
      };

      PDK.request('/v1/me/following/users/', params, (response) => {
        if (!response || response.error) {
          alert('Error occurred');
        } else {
          users = users.concat(response.data);
          if (response.hasNext) {
            response.next();
          }
        }

        $scope.localData[$scope.today].following = angular.copy(users);
        $scope.updateStorage();
        $scope.refreshTodayData();
      });
    }
  };
  $scope.getFollowing();
  
  $scope.difference_f1_f2 = (f1,f2) => {
    let users = [];
    let k = 0;
    let flag = 0;

    for (let i in f1) {
      flag = 0;
	
      for (let j in f2) {
        if (f1[i].username == f2[j].username) {
          flag = 1;
          break;
        }
      }

      if (flag == 0) {
        users[k++] = f1[i];
      }
    }
    return users;
  };

  $scope.refreshTodayData = () => {
    // following vs followers
    $scope.noFollowBack     = $scope.difference_f1_f2($scope.localData[$scope.today].following, $scope.localData[$scope.today].followers);

    // followers vs following
    $scope.followerNoFollow = $scope.difference_f1_f2($scope.localData[$scope.today].followers, $scope.localData[$scope.today].following);

    // [lastDay]followers vs [today]followers  --> Old followers that now don't follow you
    $scope.unfollowers = $scope.difference_f1_f2($scope.localData[$scope.lastDay].followers, $scope.localData[$scope.today].followers);

    // [today]followers vs [lastDay]followers --> newFollowers
    $scope.newFollowers = $scope.difference_f1_f2($scope.localData[$scope.today].followers, $scope.localData[$scope.lastDay].followers);
  };
  $scope.refreshTodayData();

});
