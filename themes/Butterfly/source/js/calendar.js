/**
 * Calendar - displays a calendar of the current month. Dates appear links if there are posts for that day.
 */

(function($) {

    var aCalendar = function(language, options, object) {
      var now = new Date();
      var nDay = now.getDate();
      var nMonth = now.getMonth();
      var nYear = now.getFullYear();
      var dDay = nDay;
      var dMonth = nMonth;
      var dYear = nYear;
      var instance = object;
      var allPosts = null;
      var months = null;
      /* Current month's posts */
      var current = {
        posts: [],
        prev: null,
        next: null
      };
      var currentLanguage = 'en';
  
      initLanguage(language);
  
      var settings = $.extend({}, $.fn.aCalendar.defaults, typeof calLanguages === 'undefined' ? {} : calLanguages[currentLanguage], options);
  
      if (settings.root[0] !== '/') {
        settings.root = '/' + settings.root;
      }
  
      if (settings.root[settings.root.length - 1] !== '/') {
        settings.root += '/';
      }
  
      /**
       * Initial language.
       */
      function initLanguage(key) {
        if (key && typeof calLanguages !== 'undefined' && calLanguages[key]) {
          currentLanguage = key;
        }
      }
  
      /**
       * Click handler for next month arrow button.
       */
      function nextMonth() {
        if (dMonth < 11) {
          dMonth++;
        } else {
          dMonth = 0;
          dYear++;
        }
  
        draw();
      };
  
      /**
       * Click handler for previous month arrow button.
       */
      function previousMonth() {
        if (dMonth > 0) {
          dMonth--;
        } else {
          dMonth = 11;
          dYear--;
        }
  
        draw();
      };
  
      /**
       * Click handler for navigating to a month if there are posts.
       */
      function toPostsMonth(date) {
        if (date) {
          dYear = date.getFullYear();
          dMonth = date.getMonth();
          draw();
        }
      }
  
      /**
       * Load current month's posts.
       */
      function loadPosts() {
        if (settings.single) {
          loadAllPosts();
        } else {
          loadPostsByMonth();
        }
      }
  
      /**
       * Load all month's posts.
       */
      function loadAllPosts() {
        if (settings.url != null && settings.url != '') {
          if (allPosts === null) {
            $.ajax({
              url: settings.url,
              async: false,
              success: function(data) {
                allPosts = data;
                initMonths(Object.keys(allPosts));
              }
            });
          }
  
          if (allPosts !== null) {
            if (parse()) {
              current.posts = allPosts[dYear + '-' + (dMonth + 1)];
            }
          }
        }
      }
  
      /**
       * Load posts by the month.
       */
      function loadPostsByMonth() {
        if (months === null) {
          $.ajax({
            url: settings.root + 'list.json',
            async: false,
            success: function(data) {
              initMonths(data);
            }
          });
        }
  
        if (parse()) {
          $.ajax({
            url: settings.root + dYear + '-' + (dMonth + 1) + '.json',
            async: false,
            success: function(data) {
              current.posts = data;
            }
          });
        }
      }
  
      /**
       * Initial months array.
       */
      function initMonths(array) {
        months = array.map(function(item) {
          var ym = item.split('-');
          return new Date(Date.UTC(+ym[0], +ym[1] - 1));
        });
      }
  
      /**
       * Parse posts month array, and set current.next and current.prev.
       *
       * @return if there are posts in this month, return true. ortherwise return false.
       */
      function parse() {
        var time = Date.UTC(dYear, dMonth);
  
        if (months === null || months.length === 0) {
          return false;
        }
  
        //If no posts in the current month, and before (or after) the current month yet not published articles, then the response to click previous month's (or next month's) event don't need to parse months array
        if (current.posts.length === 0 && (current.prev === null && current.next !== null && current.next.getTime() > time || current.next === null && current.prev !== null && current.prev.getTime() < time)) {
          return false;
        }
  
        current.posts = [];
  
        for (var i = 0; i < months.length; i++) {
          var cTime = months[i].getTime();
          if (time === cTime) {
            current.prev = i === 0 ? null : months[i - 1];
            current.next = i === months.length - 1 ? null : months[i + 1];
            return true;
          } else if (time < cTime) {
            current.prev = i === 0 ? null : months[i - 1];
            current.next = months[i];
            break;
          } else {
            current.prev = months[i];
            current.next = null;
          }
        }
  
        return false;
      }
  
      /**
       * Format date object.
       */
      function simpleDateFormat(date, fmt) {
        var o = {
          'LMM+': settings.months[date.getMonth()],
          'MM+': date.getMonth() + 1
        };
  
        if (/(y+)/.test(fmt)) {
          fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
        }
  
        for (var k in o) {
          if (new RegExp('(' + k + ')').test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (k === 'LMM+') ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
          }
        }
  
        return fmt;
      }
  
      /**
       * Draw calendar.
       *
       */
      function draw() {
        loadPosts();
        var dWeekDayOfMonthStart = new Date(dYear, dMonth, 1).getDay() - settings.weekOffset;
        if (dWeekDayOfMonthStart <= 0) {
          dWeekDayOfMonthStart = 6 - ((dWeekDayOfMonthStart + 1) * -1);
        }
  
        var dLastDayOfMonth = new Date(dYear, dMonth + 1, 0).getDate();
        var dLastDayOfPreviousMonth = new Date(dYear, dMonth, 0).getDate() - dWeekDayOfMonthStart + 1;
  
        var cHead = $('<div/>').addClass('cal-head');
        var cNext = $('<div/>');
        var cPrevious = $('<div/>');
        var cTitle = $('<div/>').addClass('cal-title');
        cPrevious.html(settings.headArrows.previous);
        cNext.html(settings.headArrows.next);
        curDate = new Date(Date.UTC(dYear, dMonth));
        if (current.posts.length === 0) {
          cTitle.html(simpleDateFormat(curDate, settings.titleFormat));
        } else {
          cTitleLink = $('<a/>').attr('href', simpleDateFormat(curDate, settings.titleLinkFormat))
            .attr('title', simpleDateFormat(curDate, settings.postsMonthTip))
            .html(simpleDateFormat(curDate, settings.titleFormat));
          cTitle.html(cTitleLink);
        }
  
        cPrevious.on('click', previousMonth);
        cNext.on('click', nextMonth);
  
        cHead.append(cPrevious);
        cHead.append(cTitle);
        cHead.append(cNext);
  
        var cBody = $('<table/>').addClass('cal');
  
        var dayOfWeek = settings.weekOffset;
        var cWeekHead = $('<thead/>');
        var cWeekHeadRow = $('<tr/>');
        for (var i = 0; i < 7; i++) {
          if (dayOfWeek > 6) {
            dayOfWeek = 0;
          }
  
          var cWeekDay = $('<th/>').attr('scope', 'col').attr('title', settings.dayOfWeek[dayOfWeek]);
          cWeekDay.html(settings.dayOfWeekShort[dayOfWeek]);
          cWeekHeadRow.append(cWeekDay);
          dayOfWeek++;
        }
  
        cWeekHead.append(cWeekHeadRow);
        cBody.append(cWeekHead);
  
        var cFoot = $('<tfoot/>');
        var cFootRow = $('<tr/>');
        var cPrevPosts = $('<td/>').attr('colspan', 3);
        var cPad = $('<td/>').html('&nbsp;');
        var cNextPosts = $('<td/>').attr('colspan', 3);
        if (current.prev) {
          cPrevPosts.html(settings.footArrows.previous + settings.months[current.prev.getMonth()])
            .addClass('cal-foot')
            .attr('title', simpleDateFormat(current.prev, settings.postsMonthTip));
        }
  
        if (current.next) {
          cNextPosts.html(settings.months[current.next.getMonth()] + settings.footArrows.next)
            .addClass('cal-foot')
            .attr('title', simpleDateFormat(current.next, settings.postsMonthTip));
        }
  
        cPrevPosts.on('click', function() {
          toPostsMonth(current.prev);
        });
  
        cNextPosts.on('click', function() {
          toPostsMonth(current.next);
        });
  
        cFootRow.append(cPrevPosts);
        cFootRow.append(cPad);
        cFootRow.append(cNextPosts);
        cFoot.append(cFootRow);
  
        var cMainPad = $('<tbody/>');
        var day = 1;
        var dayOfNextMonth = 1;
        for (var i = 0; i < 6; i++) {
          var cWeek = $('<tr/>');
          for (var j = 0; j < 7; j++) {
            var cDay = $('<td/>');
            if (i * 7 + j < dWeekDayOfMonthStart) {
              cDay.addClass('cal-gray');
              cDay.html(dLastDayOfPreviousMonth++);
            } else if (day <= dLastDayOfMonth) {
              if (day == dDay && nMonth == dMonth && nYear == dYear) {
                cDay.addClass('cal-today');
              }
  
              var count = {
                num: 0,
                keys: []
              };
              for (var k = 0; k < current.posts.length; k++) {
                var d = new Date(Date.parse(current.posts[k].date));
                if (d.getDate() == day) {
                  count.keys[count.num++] = k;
                }
              }
  
              if (count.num !== 0) {
                var index = count.keys[0];
                var cLink = $('<a>').attr('href', current.posts[index].link).attr('title', current.posts[index].title).html(day++);
                cDay.append(cLink);
              } else {
                cDay.html(day++);
              }
            } else {
              cDay.addClass('cal-gray');
              cDay.html(dayOfNextMonth++);
            }
  
            cWeek.append(cDay);
          }
  
          cMainPad.append(cWeek);
        }
  
        cBody.append(cWeekHead);
        cBody.append(cFoot);
        cBody.append(cMainPad);
  
        $(instance).html(cHead);
        $(instance).append(cBody);
      }
  
      return draw();
    };
  
    $.fn.aCalendar = function(Lang, oInit) {
      return this.each(function() {
        return aCalendar(Lang, oInit, $(this));
      });
    };
  
    // plugin defaults
    $.fn.aCalendar.defaults = {
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      dayOfWeekShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      postsMonthTip: 'Posts published in LMM yyyy',
      titleFormat: 'yyyy LMM',
      titleLinkFormat: '/archives/yyyy/MM/',
      headArrows: {previous: '<span class="cal-prev"></span>', next: '<span class="cal-next"></span>'},
      footArrows: {previous: '« ', next: ' »'},
      weekOffset: 0,
      single: true,
      root: '/calendar/',
      url: '/calendar.json'
    };
    $(document).ready(function () {
        $('#calendar').aCalendar('zh-CN');//'zh-CN'请根据自己博客的语言选择
    });
  }(jQuery));
  