$(function () {

    var domain = document.domain
    var arr = location.href.split('/')
    var prefix = arr[0] + "//" + arr[2]
    var category = arr[3]

    if (category != undefined && category != '') {
        domain = prefix + '/' + (category.indexOf('?') >= 0 ? category.substring(0, category.indexOf('?')) : category);
    } else
        domain = prefix
    //console.log(domain)
    var changeUrl = function (url) {
        $(".body-r .r_side").attr("src", prefix + url);
        console.log(domain)
        window.history.pushState({"url": url}, 'title', domain + "?page=" + url)
    }

    //导航菜单
    $(".tmenu ul li").hover(function () {
        $(this).children("ul").stop(true, true).delay(200).slideDown('fast');
        $(this).css("background", "#009178")
    }, function () {
        $(this).children("ul").stop(true, true).slideUp('fast');
        $(this).css("background", "")
    })

    //分支机构选择添加事件
    $("#fenzhiSelect").click(function () {
        if ($("#fenzhiListDiv").is(":hidden")) {
            $("#fenzhiListDiv").slideDown('fast');
        } else {
            $("#fenzhiListDiv").slideUp('fast');
        }
    })

    $("#fenzhiSelect").hover(function () {
        $("body").unbind("click");
    }, function () {
        $("body").bind("click", function () {
            $("#fenzhiListDiv").css("display", "none");
        });
    });


    $(".djyylist ul li").hover(function () {
        $(this).children("ul").animate({width: "464px"}, "fast");
        $(this).children("ul").css("z-index", "1000");
        $(this).children("ul").children(".info").stop(true, true).delay(200).slideDown('fast');
    }, function () {
        $(this).children("ul").animate({width: "220px"}, "fast");
        $(this).children("ul").children(".info").stop(true, true).slideUp('fast');
        $(this).children("ul").css("z-index", "");

    });

// 左侧展开
    $(".jklist ul li span").click(function () {
        if ($(this).hasClass("open")) {
            $(this).removeClass().addClass("close");
            $(this).parent("li").children("ul").slideDown('fast');
            if ($(this).parent("li").siblings("li").children("span").hasClass("close")) {
                $(this).parent("li").siblings("li").children("ul").slideUp(100);
                $(this).parent("li").siblings("li").children("span").removeClass("close");
                $(this).parent("li").siblings("li").children("span").addClass("open")
            }
            //$(this).parent("li").children("h1").css("color","#5ac482");
        } else {
            $(this).removeClass().addClass("open");
            $(this).parent("li").children("ul").slideUp('fast');
            //$(this).parent("li").children("h1").css("color","#666");
        }
    });

    $(".jklist ul li h1").click(function () {
        if ($(this).parent("li").children("span").hasClass("open")) {
            $(this).parent("li").children("span").removeClass().addClass("close");
            $(this).parent("li").children("ul").slideDown('fast');
            if ($(this).parent("li").siblings("li").children("span").hasClass("close")) {
                $(this).parent("li").siblings("li").children("ul").slideUp(100);
                $(this).parent("li").siblings("li").children("span").removeClass("close");
                $(this).parent("li").siblings("li").children("span").addClass("open")
            }
            //$(this).css("color","#5ac482");
        } else {
            $(this).parent("li").children("span").removeClass().addClass("open");
            $(this).parent("li").children("ul").slideUp('fast');
            //$(this).css("color","#666");
        }
    });

    $(".leftBar ul li span").click(function () {
        if ($(this).hasClass("open")) {
            $(this).removeClass().addClass("close");
            $(this).parent("li").children("ul").slideDown('fast');
            if ($(this).parent("li").siblings("li").children("span").hasClass("close")) {
                $(this).parent("li").siblings("li").children("ul").slideUp(100);
                $(this).parent("li").siblings("li").children("span").removeClass("close");
                $(this).parent("li").siblings("li").children("span").addClass("open")
            }
            //$(this).parent("li").children("h1").css("color","#5ac482");
        } else {
            $(this).removeClass().addClass("open");
            $(this).parent("li").children("ul").slideUp('fast');
            //$(this).parent("li").children("h1").css("color","#666");
        }
    });

    $(".leftBar ul li h1").click(function () {
        if ($(this).parent("li").children("span").hasClass("open")) {
            $(this).parent("li").children("span").removeClass().addClass("close");
            $(this).parent("li").children("ul").slideDown('fast');
            if ($(this).parent("li").siblings("li").children("span").hasClass("close")) {
                $(this).parent("li").siblings("li").children("ul").slideUp(100);
                $(this).parent("li").siblings("li").children("span").removeClass("close");
                $(this).parent("li").siblings("li").children("span").addClass("open")
            }
            //$(this).css("color","#5ac482");
        } else {
            $(this).parent("li").children("span").removeClass().addClass("open");
            $(this).parent("li").children("ul").slideUp('fast');
            //$(this).css("color","#666");
        }
    });

    $(".explainBar ul li span").click(function () {
        if ($(this).hasClass("open")) {
            $(this).removeClass().addClass("close");
            $(this).parent("li").children("ul").slideDown('fast');
            if ($(this).parent("li").siblings("li").children("span").hasClass("close")) {
                $(this).parent("li").siblings("li").children("ul").slideUp(100);
                $(this).parent("li").siblings("li").children("span").removeClass("close");
                $(this).parent("li").siblings("li").children("span").addClass("open")
            }
            //$(this).parent("li").children("h1").css("color","#5ac482");
        } else {
            $(this).removeClass().addClass("open");
            $(this).parent("li").children("ul").slideUp('fast');
            //$(this).parent("li").children("h1").css("color","#666");
        }
    });

    $(".explainBar ul li h1").click(function () {
        if ($(this).parent("li").children("span").hasClass("open")) {
            $(this).parent("li").children("span").removeClass().addClass("close");
            $(this).parent("li").children("ul").slideDown('fast');
            if ($(this).parent("li").siblings("li").children("span").hasClass("close")) {
                $(this).parent("li").siblings("li").children("ul").slideUp(100);
                $(this).parent("li").siblings("li").children("span").removeClass("close");
                $(this).parent("li").siblings("li").children("span").addClass("open")
            }
            //$(this).css("color","#5ac482");
        } else {
            $(this).parent("li").children("span").removeClass().addClass("open");
            $(this).parent("li").children("ul").slideUp('fast');
            //$(this).css("color","#666");
        }
    });


    $(".buttJoint ul li span").click(function () {
        if ($(this).hasClass("open")) {
            $(this).removeClass().addClass("close");
            $(this).parent("li").children("ul").slideDown('fast');
            if ($(this).parent("li").siblings("li").children("span").hasClass("close")) {
                $(this).parent("li").siblings("li").children("ul").slideUp(100);
                $(this).parent("li").siblings("li").children("span").removeClass("close");
                $(this).parent("li").siblings("li").children("span").addClass("open")
            }
            //$(this).parent("li").children("h1").css("color","#5ac482");
        } else {
            $(this).removeClass().addClass("open");
            $(this).parent("li").children("ul").slideUp('fast');
            //$(this).parent("li").children("h1").css("color","#666");
        }
    });

    $(".buttJoint ul li h1").click(function () {
        if ($(this).parent("li").children("span").hasClass("open")) {
            $(this).parent("li").children("span").removeClass().addClass("close");
            $(this).parent("li").children("ul").slideDown('fast');
            if ($(this).parent("li").siblings("li").children("span").hasClass("close")) {
                $(this).parent("li").siblings("li").children("ul").slideUp(100);
                $(this).parent("li").siblings("li").children("span").removeClass("close");
                $(this).parent("li").siblings("li").children("span").addClass("open")
            }
            //$(this).css("color","#5ac482");
        } else {
            $(this).parent("li").children("span").removeClass().addClass("open");
            $(this).parent("li").children("ul").slideUp('fast');
            //$(this).css("color","#666");
        }
    });

    $(".mobileDocuments ul li span").click(function () {
        if ($(this).hasClass("open")) {
            $(this).removeClass().addClass("close");
            $(this).parent("li").children("ul").slideDown('fast');
            if ($(this).parent("li").siblings("li").children("span").hasClass("close")) {
                $(this).parent("li").siblings("li").children("ul").slideUp(100);
                $(this).parent("li").siblings("li").children("span").removeClass("close");
                $(this).parent("li").siblings("li").children("span").addClass("open")
            }
            //$(this).parent("li").children("h1").css("color","#5ac482");
        } else {
            $(this).removeClass().addClass("open");
            $(this).parent("li").children("ul").slideUp('fast');
            //$(this).parent("li").children("h1").css("color","#666");
        }
    });

    $(".mobileDocuments ul li h1").click(function () {
        if ($(this).parent("li").children("span").hasClass("open")) {
            $(this).parent("li").children("span").removeClass().addClass("close");
            $(this).parent("li").children("ul").slideDown('fast');
            if ($(this).parent("li").siblings("li").children("span").hasClass("close")) {
                $(this).parent("li").siblings("li").children("ul").slideUp(100);
                $(this).parent("li").siblings("li").children("span").removeClass("close");
                $(this).parent("li").siblings("li").children("span").addClass("open")
            }
            //$(this).css("color","#5ac482");
        } else {
            $(this).parent("li").children("span").removeClass().addClass("open");
            $(this).parent("li").children("ul").slideUp('fast');
            //$(this).css("color","#666");
        }
    });


    $(".toolBar ul li span").click(function () {
        if ($(this).hasClass("open")) {
            $(this).removeClass().addClass("close");
            $(this).parent("li").children("ul").slideDown('fast');
            if ($(this).parent("li").siblings("li").children("span").hasClass("close")) {
                $(this).parent("li").siblings("li").children("ul").slideUp(100);
                $(this).parent("li").siblings("li").children("span").removeClass("close");
                $(this).parent("li").siblings("li").children("span").addClass("open")
            }
            //$(this).parent("li").children("h1").css("color","#5ac482");
        } else {
            $(this).removeClass().addClass("open");
            $(this).parent("li").children("ul").slideUp('fast');
            //$(this).parent("li").children("h1").css("color","#666");
        }
    });

    $(".toolBar ul li h1").click(function () {
        if ($(this).parent("li").children("span").hasClass("open")) {
            $(this).parent("li").children("span").removeClass().addClass("close");
            $(this).parent("li").children("ul").slideDown('fast');
            if ($(this).parent("li").siblings("li").children("span").hasClass("close")) {
                $(this).parent("li").siblings("li").children("ul").slideUp(100);
                $(this).parent("li").siblings("li").children("span").removeClass("close");
                $(this).parent("li").siblings("li").children("span").addClass("open")
            }
            //$(this).css("color","#5ac482");
        } else {
            $(this).parent("li").children("span").removeClass().addClass("open");
            $(this).parent("li").children("ul").slideUp('fast');
            //$(this).css("color","#666");
        }
    });

    $(".rtc ul li span").click(function () {
        if ($(this).hasClass("open")) {
            $(this).removeClass().addClass("close");
            $(this).parent("li").children("ul").slideDown('fast');
            if ($(this).parent("li").siblings("li").children("span").hasClass("close")) {
                $(this).parent("li").siblings("li").children("ul").slideUp(100);
                $(this).parent("li").siblings("li").children("span").removeClass("close");
                $(this).parent("li").siblings("li").children("span").addClass("open")
            }
            //$(this).parent("li").children("h1").css("color","#5ac482");
        } else {
            $(this).removeClass().addClass("open");
            $(this).parent("li").children("ul").slideUp('fast');
            //$(this).parent("li").children("h1").css("color","#666");
        }
    });

    $(".rtc ul li h1").click(function () {
        if ($(this).parent("li").children("span").hasClass("open")) {
            $(this).parent("li").children("span").removeClass().addClass("close");
            $(this).parent("li").children("ul").slideDown('fast');
            if ($(this).parent("li").siblings("li").children("span").hasClass("close")) {
                $(this).parent("li").siblings("li").children("ul").slideUp(100);
                $(this).parent("li").siblings("li").children("span").removeClass("close");
                $(this).parent("li").siblings("li").children("span").addClass("open")
            }
            //$(this).css("color","#5ac482");
        } else {
            $(this).parent("li").children("span").removeClass().addClass("open");
            $(this).parent("li").children("ul").slideUp('fast');
            //$(this).css("color","#666");
        }
    });


    $(".tlogo").hover(function () {
        $(this).children(".lshow").slideDown('fast');
    }, function () {
        $(this).children(".lshow").slideUp('fast');
    })

    var goTop = function () {
        $('body,html').animate({
            scrollTop: 0
        }, 700);
    }

    $(".body-l .jklist .section").click(function () {
        $('.jklist ul li .section').css('border', "");
        goTop();
        var url = $(this).data("url");
        $(this).css('border', '1px solid #00825f');
        changeUrl(url);
    });

    $(".body-l .leftBar .section").click(function () {
        $('.leftBar ul li .section').css('border', "");
        goTop();
        var url = $(this).data("url");
        $(this).css('border', '1px solid #00825f');
        changeUrl(url);
    });

    $(".body-l .explainBar .section").click(function () {
        $('.explainBar ul li .section').css('border', "");
        goTop();
        var url = $(this).data("url");
        $(this).css('border', '1px solid #00825f');
        changeUrl(url);
    });

    $(".body-l .buttJoint .section").click(function () {
        $('.buttJoint ul li .section').css('border', "");
        goTop();
        var url = $(this).data("url");
        $(this).css('border', '1px solid #00825f');
        changeUrl(url);
    });

    $(".body-l .mobileDocuments .section").click(function () {
        $('.mobileDocuments ul li .section').css('border', "");
        goTop();
        var url = $(this).data("url");
        $(this).css('border', '1px solid #00825f');
        changeUrl(url);
    });

    $(".body-l .toolBar .section").click(function () {
        $('.toolBar ul li .section').css('border', "");
        goTop();
        var url = $(this).data("url");
        $(this).css('border', '1px solid #00825f');
        changeUrl(url);
    });

    $(".body-l .rtc .section").click(function () {
        $('.rtc ul li .section').css('border', "");
        goTop();
        var url = $(this).data("url");
        $(this).css('border', '1px solid #00825f');
        changeUrl(url);
    });

    $.get('/data/suggest', function (res) {
        if (res != null) {
            $('#suggest').empty()
            $.each(res, function (i, item) {
                $('#suggest').append('<option>' + item + '</option>')
            })
        }
    })

    $('.search-box .search-btn').click(() => search())

    $('#search-input').keyup(function (e) {
        if (e.keyCode === 13) search()
    })

    $.get('/data/commonUse', {size: 4}, function (data) {
        if (data != null && !isNull(data)) {
            $('.sub-nav').empty()
            $('.sub-nav').append('常用搜索：\n')
            $.each(data, function (i, item) {
                $('.sub-nav').append('<a href="search.html?words=' + item + '">' + item + '</a>')
            })
        } else {
            $('.sub-nav').append('常用搜索：\n' +
                '<a href="search.html?words=接口鉴权">接口鉴权</a>\n' +
                '<a href="search.html?words=座席外呼">座席外呼</a>\n' +
                '<a href="search.html?words=来电通话记录">来电通话记录</a>' +
                '<a href="search.html?words=外呼通话记录">外呼通话记录</a> ')
        }
    })
});

//清空初始值
function OnEnter(field) {
    if (field.value == field.defaultValue) {
        field.value = "";
    }
}

function OnExit(field) {
    if (field.value == "") {
        field.value = field.defaultValue;
    }
}

function search() {
    let keyword = $('#search-input').val()
    if (keyword === null || keyword === undefined || keyword === '') return
    else location.href = '/search.html?words=' + keyword
}

function loadData(keyword) {
    $.get('/data/search', {keyword: keyword}, function (data) {
        if (data != null && !isNull(data)) {
            $('#category').empty()
            $('#result').empty()
            if (data.index != null && data.index.length > 0) {
                $('#category').append('<a href="search.html?category=index&keyword=' + keyword + '">API(' + data.index.length + ')</a>')
                $.each(data.index, function (i, item) {
                    makeResult(keyword, 'index', item.name, item.path, item.summary, item.apiUrl)
                })
            }
            if (data.toolbarIndex != null && data.toolbarIndex.length > 0) {
                $('#category').append('<a href="search.html?category=toolbarIndex&keyword=' + keyword + '">软电话工具条(' + data.toolbarIndex.length + ')</a>')
                $.each(data.toolbarIndex, function (i, item) {
                    makeResult(keyword, 'toolbarIndex', item.name, item.path, item.summary, item.apiUrl)
                })
            }
            if (data.rtc != null && data.rtc.length > 0) {
                $('#category').append('<a href="search.html?category=rtc&keyword=' + keyword + '">RTC(' + data.rtc.length + ')</a>')
                $.each(data.rtc, function (i, item) {
                    makeResult(keyword, 'rtc', item.name, item.path, item.summary, item.apiUrl)
                })
            }
            if (data.apiTest != null && data.apiTest.length > 0) {
                $('#category').append('<a href="search.html?category=apiTest&keyword=' + keyword + '">API TEST(' + data.apiTest.length + ')</a>')
                $.each(data.apiTest, function (i, item) {
                    makeResult(keyword, 'apiTest', item.name, item.path, item.summary, item.apiUrl)
                })
            }
            if (data.explain != null && data.explain.length > 0) {
                $('#category').append('<a href="search.html?category=explain&keyword=' + keyword + '">业务场景说明(' + data.explain.length + ')</a>')
                $.each(data.explain, function (i, item) {
                    makeResult(keyword, 'explain', item.name, item.path, item.summary, item.apiUrl)
                })
            }
            if (data.accountInfo != null && data.accountInfo.length > 0) {
                $('#category').append('<a href="search.html?category=accountInfo&keyword=' + keyword + '">视频说明(' + data.accountInfo.length + ')</a>')
                $.each(data.accountInfo, function (i, item) {
                    makeResult(keyword, '开户信息', item.name, item.path, item.summary, item.apiUrl)
                })
            }
            if (data.deployment != null && data.deployment.length > 0) {
                $('#category').append('<a href="search.html?category=deployment&keyword=' + keyword + '">客户侧环境部署规范(' + data.deployment.length + ')</a>')
                $.each(data.deployment, function (i, item) {
                    makeResult(keyword, '客户侧环境部署规范', item.name, item.path, item.summary, item.apiUrl)
                })
            }
            if (data.standard != null && data.standard.length > 0) {
                $('#category').append('<a href="search.html?category=standard&keyword=' + keyword + '">平台标准(' + data.standard.length + ')</a>')
                $.each(data.standard, function (i, item) {
                    makeResult(keyword, '平台标准', item.name, item.path, item.summary, item.apiUrl)
                })
            }
            if (data.standard != null && data.standard.length > 0) {
                $('#category').append('<a href="search.html?category=standard&keyword=' + keyword + '">平台标准(' + data.standard.length + ')</a>')
                $.each(data.standard, function (i, item) {
                    makeResult(keyword, '平台标准', item.name, item.path, item.summary, item.apiUrl)
                })
            }
        } else {
            $('.result-category-bar').css({'display': 'none'})
            $('#result').html('<div class="empty-box">\n' +
                '  <img src="framework/images/helpcenter/抱歉.png" alt="抱歉">\n' +
                '  <p>抱歉，没有找到您期望的内容，请更换搜索内容试试吧</p>\n' +
                '</div>')
        }
    })
}

function loadDataByCategory(category, keyword) {
    console.log(category, keyword)
    $.get('/data/searchByCategory', {category: category, keyword: keyword}, function (data) {
        console.log("data:", data)
        if (data != null && !isNull(data)) {
            $.each(data, function (i, item) {
                makeResult(keyword, nickName(category), item.name, item.path, item.summary, item.apiUrl)
            })
        }
    })
}

function isNull(obj) {
    if (JSON.stringify(obj) === '{}') return true;
    return false;
}

function makeUrl(category, path) {
    return category + '.html?page=' + path
}

function makeResult(word, category, name, path, summary, apiUrl) {
    $('#result').append('<div class="search-result">\n' +
        '  <p class="title"><a href="' + makeUrl(category, path) + '">' + wordReplace(word, name) + '</a></p>\n' +
        '  <p>' + wordReplace(word, summary) + '</p>\n' +
        '  <p>API URL 接口请求地址：' + wordReplace(word, decodeURI(apiUrl)) + '</p>\n' +
        '</div>')
}

function wordReplace(word, str) {
    let pattern = new RegExp(word, 'g')
    return str.replace(pattern, '<font color="red">' + word + '</font>')
}

function nickName(str) {
    switch (str) {
        case "accountInfo":
            return "开户信息";
        case "deployment":
            return "客户侧环境部署规范";
        case "standard":
            return "平台标准";
        default:
            return str;
    }
}

$(document).ready(function () {
    var domain = document.domain
    var arr = location.href.split('/')
    var domain = arr[0] + "//" + arr[2]
    var strVar = "";
    var host = window.location.hostname;
    var oem_hosts = ["wiki-2020.cticloud.cn", "wiki.alicti.cn", "wiki-dev.alicti.cn"];

    strVar += "		<ul>";
    strVar += "			<li class='dgfont'><a href='" + domain + "/index.html' class='dgfont'>API</a></li>";
    strVar += "			<li class='arrow'></li>";
    strVar += "			<li class='dgfont'><a href='" + domain + "/toolbarIndex.html' class='dgfont'>软电话工具条</a></li>";
    strVar += "			<li class='arrow'></li>";
    strVar += "			<li class='dgfont'><a href='" + domain + "/rtc.html' class='dgfont'>RTC</a></li>";
    strVar += "			<li class='arrow'></li>";
    strVar += "			<li class='oem dgfont'><a href='" + domain + "/apiTest.html' class='dgfont'>API TEST</a></li>";
    // strVar += "			<li class='oem arrow'></li>";
    // strVar += "			<li class='oem dgfont'><a href='" + domain + "/explain.html' class='dgfont'>业务场景说明</a></li>";
    // strVar += "			<li class='oem arrow'></li>";
    // strVar += "			<li class='oem dgfont'><a href='" + domain + "/开户信息.html' class='dgfont'>视频说明</a></li>";
    strVar += "			<li class='oem arrow'></li>";
    strVar += "			<li class='dgfont'><a href='" + domain + "/客户侧环境部署规范.html' class='dgfont'>客户侧环境部署规范</a></li>";
    strVar += "			<li class='arrow'></li>";
    strVar += "			<li class='dgfont'><a href='" + domain + "/平台标准.html' class='dgfont'>平台标准</a></li>";
    // strVar += "			<li class='arrow'></li>";
    /*	strVar += "         <li class='dgfont'><a href='" + domain + "/平台对接流程.html' class='dgfont'>平台对接流程</a></li>";
        strVar += "			<li class='arrow'></li>";*/
    // strVar += "         <li class='oem dgfont'><a href='" + domain + "/移动端文档.html' class='dgfont'>移动端文档</a></li>";
    strVar += "		</ul>";
    $(".subTag").html(strVar);
    // document.title = "CTICloud帮助中心";
    if (host != null && host != undefined && host != "" && (host === "wiki-2020.cticloud.cn" || host === "wiki.alicti.cn" || host === "wiki-dev.alicti.cn")) {
        $('.oem').hide();
        $('.footer').hide();
        $('.ttop').hide();
        var $favicon = document.querySelector('link[rel="icon"]');
        if ($favicon !== null) {
            $favicon.href = '';
        }
    } else {
        if (document.getElementsByName("description").length > 0) {
            document.getElementsByName("description")[0].content = "天润融通为客户提供服务型呼叫中心系统、外呼型呼叫中心系统、分布 式呼叫中心系统、智能语音云平台,是呼叫中心（call center）行业的创新者.为百度、大众点评等众多客户提 供呼叫中心解决方案.";
        }
    }
});
