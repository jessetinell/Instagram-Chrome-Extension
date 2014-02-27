var InstagramAPI = function (accessToken) {
    this.request = function (method, arguments, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            callback(JSON.parse(xhr.response));
        };

        xhr.open("GET", "https://api.instagram.com/v1/" + method + "?access_token=" + accessToken);
        xhr.send();
    };
}

onload = function () {
    var feed = document.getElementById("feed");
    var loader = document.getElementById("loader");

    var redirectUrl = "https://" + chrome.runtime.id + ".chromiumapp.org/";

    /* == Get your client id at instagram.com/developer == */
    var clientId = "";

    var authUrl = "https://instagram.com/oauth/authorize/?" +
        "client_id=" + clientId + "&" +
        "response_type=token&" +
        "redirect_uri=" + encodeURIComponent(redirectUrl);

    chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true
        },
        function (responseUrl) {

            var accessToken = responseUrl.substring(responseUrl.indexOf("=") + 1);

            var api = new InstagramAPI(accessToken);
            api.request("users/self/feed", undefined, function (data) {
                if (data.meta.code == 200) {
                    feed.innerHTML = formatFeed(data);
                    loader.style.display = "none";
                }

            });
        });

};

function formatFeed(data) {
    var photos = data.data;
    if (photos.length > 0) {
        var html = "";
        for (var key in photos) {
            html += "<div>"

            var photo = photos[key];
            var user = photo.user;
            var likes = photo.likes;

            html += '<div class="user">';
            html += '<img src=' + user.profile_picture + ' class="left" alt=""/>';

            html += '<div class="row left">';
            html += '<b class="blue left">' + user.username + '</b>';
            html += '<b class="grey right">' + FormatTimeSpan(photo.created_time) + '</b>';
            html += '</div>';

            html += '</div>';

            html += '<img src="' + photo.images.standard_resolution.url + '" alt="">';

            html += '<div class="container">';

            /* == Likes == */
            if (likes.count > 0) {
                html += '<div class="likes row">';
                for (var i = 0; i < likes.data.length; i++) {
                    html += '<b class="blue left">' + likes.data[i].username;

                    if (i !== likes.data.length - 1)
                        html += ', ';
                    html += '</b>';
                };

                //show remaining like-count
                if (likes.data.length < likes.count) {
                    var remaining = likes.count - likes.data.length;
                    html += '<p class="grey left"> and <b>' + remaining + '</b> others like this.</p>';
                }
                html += '</div>';
            }
            /* == End of Likes == */


            /* == Caption == */
            if (photo.caption != null) {
                html += "<p>" + photo.caption.text + "</p>";
            }
            /* == End of Caption == */


            /* == Comments == */
            var comments = photo.comments;
            if (comments != null) {
                html += '<div class="comments row">';
                if (comments.data.length < comments.count) {
                    var remaining = comments.count - comments.data.length;
                    html += '<b class="grey">' + remaining + ' more comments</b>';
                }
                for (var c in comments.data) {
                    var comment = comments.data[c];
                    html += '<div class="row">';
                    html += '<img class="left" alt="" src="' + comment.from.profile_picture + '" />';
                    html += '<b class="blue left">' + comment.from.username + '</b>';
                    html += '<p class="left">' + comment.text + '</p>';
                    html += '</div>';
                }
                html += '</div>';
            }
            /* == End of Comments == */


            //End of .container
            html += "</div>";

            //End of #feed
            html += "</div>";
        }
        return html;
    } else {
        alert('No one has posted any images...yet');
    }
}

function FormatTimeSpan(unixTime) {
    var now = new Date().getTime();
    var visitTime = new Date(unixTime * 1000);

    var timespan = new TimeSpan(visitTime - now);

    var days = timespan.getDays().toString().replace('-', '');
    var hours = timespan.getHours().toString().replace('-', '');
    var minutes = timespan.getMinutes().toString().replace('-', '');
    var seconds = timespan.getSeconds().toString().replace('-', '');

    var returnValue;

    if (days < 1) {
        if (hours < 1) {
            if (minutes < 1) {
                returnValue = seconds;
                returnValue += seconds + " seconds ";
            } else {
                returnValue = minutes;
                returnValue += minutes > 1 ? " minutes " : " minute ";

            }
        } else {
            returnValue = hours;
            returnValue += hours > 1 ? " hours " : " hour ";
        }
    } else {
        returnValue = days;
        returnValue += days > 1 ? " days " : " day ";
    }
    return returnValue + "ago";
}