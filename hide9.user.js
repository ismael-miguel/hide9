// ==UserScript==
// @name         9gag Hide promoted/bot content
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Hides all the content that belongs to 9GAGGER bot or promoted content
// @author       Ismael Miguel
// @supportURL   https://github.com/ismael-miguel/9gag-post-hide/issues
// @match        *://9gag.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=9gag.com
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    var PROMOTED_CLASS = 'promoted';
    var PROMOTED_HREF = 'javascript:void(0);';
    var POST_ID_PREFIX = 'jsid-post-';
    var HIDE_STYLE = 'max-height:2px;overflow:hidden;margin:0px;padding:0px;border:none;visibility:hidden';

    var MO_OPTIONS = {
        childList: true,
        attributes: false,
        subtree: false,
        characterData: false
    };

    var list = document.getElementById('list-view-2');
    if(!list) return;

    var info = {
        total: 0,
        hidden: 0,
        shown: 0,
        hidden_data: [],
        ids: [],
        data: {},
        all_data: []
    };

    // lazy, so, copy-paste: https://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
    function escapeHtml(unsafe)
    {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // ============================================ UI AREA ============================================

    // ====================== ICONS ======================

    var svg_icons = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg_icons.innerHTML = [ // this makes me feel dirty...
        '<symbol id="hide9-icon-promoted" viewBox="0 0 20 20">',
            '<g fill="currentColor"><path d="M13.3333 15H15V5H5V6.66667H12.1583L5 13.825L6.175 15L13.3333 7.84167V15Z" fill="#999999"></path></g>',
        '</symbol>',
        '<symbol id="hide9-icon-9ghost" viewBox="0 0 100 100">',
            '<g fill="currentColor">',
                '<rect width="100" height="100" fill="black"></rect>',
                '<path d="M50 24.1667C43.8337 24.1667 37.92 26.6162 33.5598 30.9764C29.1995 35.3367 26.75 41.2504 26.75 47.4167V75.8333L34.5 68.0833L42.25 75.8333L50 68.0833L57.75 75.8333L65.5 68.0833L73.25 75.8333V47.4167C73.25 41.2504 70.8004 35.3367 66.4402 30.9764C62.08 26.6162 56.1663 24.1667 50 24.1667V24.1667ZM42.25 39.6667C43.6203 39.6667 44.9344 40.211 45.9034 41.18C46.8723 42.1489 47.4167 43.4631 47.4167 44.8333C47.4167 46.2036 46.8723 47.5178 45.9034 48.4867C44.9344 49.4557 43.6203 50 42.25 50C40.8797 50 39.5656 49.4557 38.5966 48.4867C37.6277 47.5178 37.0833 46.2036 37.0833 44.8333C37.0833 43.4631 37.6277 42.1489 38.5966 41.18C39.5656 40.211 40.8797 39.6667 42.25 39.6667V39.6667ZM57.75 39.6667C59.1203 39.6667 60.4344 40.211 61.4034 41.18C62.3723 42.1489 62.9167 43.4631 62.9167 44.8333C62.9167 46.2036 62.3723 47.5178 61.4034 48.4867C60.4344 49.4557 59.1203 50 57.75 50C56.3797 50 55.0656 49.4557 54.0966 48.4867C53.1277 47.5178 52.5833 46.2036 52.5833 44.8333C52.5833 43.4631 53.1277 42.1489 54.0966 41.18C55.0656 40.211 56.3797 39.6667 57.75 39.6667V39.6667Z" fill="white"></path>',
            '</g>',
        '</symbol>'
    ].join('');
    svg_icons.style.display = 'none';
    document.body.prepend(svg_icons);
    svg_icons = null;


    // ====================== MENU ======================

    var ui = document.createElement('div');
    ui.innerHTML = [ // yuck, but faster to write and change
        '<a id="hide9-button" class="search" href="javascript:void(0);">Hidden posts</a>',
        '<div id="hide9-menu" class="notification-menu" style="display:none">',
            '<div class="tab-bar">',
                '<a href="javascript:void(0)" class="active"> <span id="hide9-hidden" style="color:#09f">0</span> Hidden </a>',
                '<a href="javascript:void(0)" style="cursor:default"> <span id="hide9-shown" style="color:#09f">0</span> Shown </a>',
            '</div>',
            '<div class="notification-list viewport">',
                '<ul id="hide9-posts" class="overview">',
                '</ul>',
                '<div style="height:1px"></div>',
            '</div>',
        '</div>'
    ].join('');

    ui.className = 'general-function';

    var ui_menu_hidden = true;
    var ui_menu = ui.querySelector('#hide9-menu');
    var ui_button = ui.querySelector('#hide9-button');
    var ui_total_shown = ui.querySelector('#hide9-shown');
    var ui_total_hidden = ui.querySelector('#hide9-hidden');
    var ui_posts = ui.querySelector('#hide9-posts');

    ui_button.setAttribute('style', "background-size:24px;background-position:6px;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23999' viewBox='0 0 16 16'%3E%3Cpath d='m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z'/%3E%3Cpath d='M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z'/%3E%3C/svg%3E\");");
    ui_button.addEventListener('click', function(){
        ui_menu.style.display = (ui_menu_hidden = !ui_menu_hidden) ? 'none' : 'block';
    });


    // ====================== UI FUNCTIONS ======================

    var ui_add = function ui_add(post){
        var li = document.createElement('li');

        li.innerHTML = (
            post.promoted
            ? [
                '<div class="noti-item unread">',
                   '<div class="noti-icon left avatar">',
                       '<svg width="40" height="40"><use href="#hide9-icon-promoted"></svg>',
                   '</div>',
                   '<div class="noti-text">',
                       '<span>Post hidden: <span class="noti-text grey">Promoted content</span></span>',
                    '</div>',
                '</div>'
            ]
            : [
                '<a href="' + escapeHtml(post.href) + '" target="_blank" class="noti-item unread">',
                   '<div class="noti-icon left avatar">',
                       '<svg width="40" height="40"><use href="#hide9-icon-9ghost"></svg>',
                   '</div>',
                   '<div class="noti-text">',
                       '<span>Post hidden: ',
                           escapeHtml(post.title),
                       '</span>',
                    '</div>',
                    '<div class="noti-icon right">',
                        '<picture><img src="https://img-9gag-fun.9cache.com/photo/' + escapeHtml(post.id) + '_fbthumbnail.jpg"></picture>',
                    '</div>',
                '</a>'
            ]
        ).join('');

        ui_posts.appendChild(li);
    };

    var ui_update = function ui_update(){
        ui_total_shown.textContent = info.shown;
        ui_total_hidden.textContent = info.hidden;
    };


    document.querySelector('#top-nav .function-wrap').appendChild(ui);


    // ============================================ HIDDING AREA ============================================

    var hide_menu = [];
    var hidding = false;

    var click_next = function click_next(){
        if(!hide_menu.length)
        {
            hidding = false;
            return;
        }

        var menu_parent = hide_menu.shift();

        var menu_icon = menu_parent.querySelector('.button');
        if(!menu_icon)
        {
            return;
        }

        menu_icon.addEventListener('click', function(){
            setTimeout(function click_handler(){
                var a = Array.from(menu_parent.querySelectorAll('.menu a')).filter(function menu_item_filter(menu_item){
                    return menu_item.textContent === 'I don\'t like this';
                })[0];

                if(!a) return;

                a.addEventListener('click', function(){
                    click_next();
                });

                a.click();
            }, 150);
        });
        menu_icon.click();
    };

    var start_click = function start_click(){
        if(hidding || !hide_menu.length)
        {
            return;
        }

        hidding = true;
        click_next();
    };


    var cleanup_article = function cleanup_article(article){
        var a = article.querySelector('.ui-post-creator__author');

        var id = article.id;
        var post_id = id.replace(POST_ID_PREFIX, '');

        if(post_id && info.data[post_id])
        {
            return;
        }

        var post = {
            id: post_id,
            promoted: a.classList.contains(PROMOTED_CLASS),
            title: (article.querySelector('h1') || {textContent: '<No title>'}).textContent,
            href: post_id ? 'https://9gag.com/gag/' + post_id : PROMOTED_HREF,
            author: (article.querySelector('.ui-post-creator__author') || {textContent: '<No author>'}).textContent
        };

        info.total++;
        info.all_data.push(post);

        if(post_id)
        {
            info.ids.push(post_id);

            info.data[post_id] = post;

            if(a.href !== PROMOTED_HREF)
            {
                info.shown++;
                return;
            }
        }

        var menu_parent = article.querySelector('.uikit-popup-menu');
        if(!menu_parent)
        {
            return;
        }

        info.hidden++;
        info.hidden_data.push(post);
        ui_add(post);

        hide_menu.push(menu_parent);
    };

    var cleanup = function cleanup(node){
        node.querySelectorAll('article').forEach(cleanup_article);
        ui_update();
    };


    // ====================== ELEMENT INSERTION HANDLERS ======================

    var observer = new MutationObserver(function mutation_handler(mutations){
        setTimeout(function(){
            start_click();

            mutations.forEach(function mutation_loop(mutation){
                mutation.addedNodes.forEach(cleanup);
            });

            setTimeout(start_click, 500);
        }, 500);
    });
    observer.observe(list, MO_OPTIONS);

    list.querySelectorAll('.list-stream').forEach(cleanup);
    start_click();

    var double_check = function double_check(){
        start_click();

        list.querySelectorAll('.list-stream[data-hide9-to-dc="1"]').forEach(function double_check(node){
            console.log('Double-checking:', node, node.querySelectorAll('article'));

            cleanup(node);

            node.removeAttribute('data-hide9-to-dc');
        });

        start_click();
    };

    // setInterval(double_check, 2500);

    /*window.addEventListener('error', function(){
        double_check();
        return false;
    });*/

    // forces to click the menu, if a post that shouldn't exist still exists
    setInterval(function(){
        info.hidden_data.forEach(function(post){
            if(!post.id) return;

            var article = document.getElementById(POST_ID_PREFIX + post.id);

            if(!article) return;

            article.querySelector('.uikit-popup-menu .button').click();
        });

        start_click();
    }, 2500);


    // ============================================ GLOBAL FUNCTIONS ============================================

    window.hide9 = {
        getData: function getData(){
            // deep clone: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
            return JSON.parse(JSON.stringify(info));
        },
        getQueue: function getQueue(){
            return {hidding: hidding, menus: hide_menu};
        },
        getPostData: function getPostData(id){
            if(id instanceof Element)
            {
                id = id.id.replace(POST_ID_PREFIX, '');
            }

            return info.data[id];
        },
        isPostToBeHidden: function isPostToBeHidden(id){
            if(id instanceof Element)
            {
                id = id.id.replace(POST_ID_PREFIX, '');
            }

            return info.hidden_data.filter(function(post){
                return post.id === id;
            }).length > 0;
        },
        getPostId: function getPostId(elem){
            return elem.id.replace(POST_ID_PREFIX, '');
        },/*,
        forceDoubleCheck: function forceDoubleCheck(){
            double_check();
        }*/
    };
})();
