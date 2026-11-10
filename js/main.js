/* ============================================================
   胡昊的个人主页 · 交互脚本（原生 JavaScript，无任何第三方库）
   内容：打字机 / 拆字动画 / 滚动揭示 / 导航高亮 / 数字滚动 /
         技能条 / 3D 倾斜 / 作品筛选 / 详情弹窗 / 深浅主题 /
         表单与本地存储 / 回到顶部
   ============================================================ */
(function () {
    'use strict';

    // 有脚本时才启用「滚动前隐藏」的效果；禁用 JS 时页面内容依然完整可读
    document.documentElement.classList.add('js-ready');

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $ = function (sel, root) { return (root || document).querySelector(sel); };
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

    /* ---------- 1. 打字机文字效果 --------------------------------
       与参考项目「乱码解码」不同，这里用逐字输入 + 退格的命令行效果 */
    (function typewriter() {
        var el = $('#typewriter');
        if (!el) return;
        var lines = [
            '软件工程 · 2024 级本科生',
            '正在学 HTML / CSS / JavaScript',
            '喜欢把想法做成能点开的页面'
        ];
        if (reduceMotion) return;                 // 尊重系统减少动效设置
        var line = 0, ch = 0, deleting = false;

        function tick() {
            var text = lines[line];
            if (!deleting) {
                el.textContent = text.slice(0, ++ch);
                if (ch === text.length) { deleting = true; return setTimeout(tick, 2400); }
                return setTimeout(tick, 78);
            }
            el.textContent = text.slice(0, --ch);
            if (ch === 0) { deleting = false; line = (line + 1) % lines.length; return setTimeout(tick, 420); }
            return setTimeout(tick, 34);
        }
        el.textContent = '';
        setTimeout(tick, 500);
    }());

    /* ---------- 2. 标题拆字：逐字浮现 ----------------------------
       把 .split-text 的每个字包进 span，用 animation-delay 形成波浪 */
    $$('.split-text').forEach(function (el) {
        var text = el.textContent.trim();
        el.setAttribute('aria-label', text);
        var holder = document.createElement('span');
        holder.setAttribute('aria-hidden', 'true');
        Array.from(text).forEach(function (c, i) {
            if (c === ' ') { holder.appendChild(document.createTextNode(' ')); return; }
            var span = document.createElement('span');
            span.className = 'char';
            span.textContent = c;
            span.style.animationDelay = (i * 65) + 'ms';
            holder.appendChild(span);
        });
        el.textContent = '';
        el.appendChild(holder);
    });

    /* ---------- 3. 滚动揭示（IntersectionObserver） ---------------
       元素进入视口时加上 .is-visible，标题拆字与手绘下划线随之播放 */
    (function reveal() {
        var items = $$('[data-reveal]');
        if (reduceMotion || !('IntersectionObserver' in window)) {
            items.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        items.forEach(function (el) { io.observe(el); });
    }());

    /* ---------- 4. 数字滚动动画 ---------------------------------- */
    function countUp(el, target, duration) {
        if (reduceMotion) { el.textContent = target; return; }
        var start = null;
        function step(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased);
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }
    setTimeout(function () {
        $$('.count').forEach(function (el) {
            countUp(el, Number(el.dataset.count) || 0, 1300);
        });
    }, 300);

    /* ---------- 5. 技能条：进入视口后生长 + 百分比递增 ------------ */
    (function skills() {
        var card = $('.skill-card');
        if (!card) return;
        function play() {
            $$('.skill-fill', card).forEach(function (bar) {
                bar.style.width = bar.dataset.level + '%';
            });
            $$('.skill-num', card).forEach(function (num) {
                if (reduceMotion) { num.textContent = num.dataset.num + '%'; return; }
                var target = Number(num.dataset.num), start = null;
                function step(ts) {
                    if (!start) start = ts;
                    var p = Math.min((ts - start) / 1200, 1);
                    num.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + '%';
                    if (p < 1) requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
            });
        }
        if (reduceMotion || !('IntersectionObserver' in window)) { play(); return; }
        var io = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) { play(); io.disconnect(); }
        }, { threshold: 0.35 });
        io.observe(card);
    }());

    /* ---------- 6. 卡片 3D 倾斜（鼠标跟随） ----------------------
       用 CSS 自定义属性 --rx / --ry 传值，避免和滚动揭示的 transform 冲突 */
    if (!reduceMotion) {
        $$('[data-tilt]').forEach(function (card) {
            card.addEventListener('mousemove', function (e) {
                var box = card.getBoundingClientRect();
                var px = (e.clientX - box.left) / box.width - 0.5;
                var py = (e.clientY - box.top) / box.height - 0.5;
                card.style.setProperty('--ry', (px * 9).toFixed(2) + 'deg');
                card.style.setProperty('--rx', (-py * 9).toFixed(2) + 'deg');
            });
            card.addEventListener('mouseleave', function () {
                card.style.setProperty('--rx', '0deg');
                card.style.setProperty('--ry', '0deg');
            });
        });
    }

    /* ---------- 7. 导航高亮 + 回到顶部按钮 ------------------------ */
    (function scrollUI() {
        // 只取页内锚点链接：# 开头的才参与高亮，外链（如 GitHub）自动忽略
        var links = $$('.nav-link').filter(function (a) {
            return (a.getAttribute('href') || '').charAt(0) === '#';
        });
        var sections = links.map(function (a) { return $(a.getAttribute('href')); });
        var toTop = $('#toTop');

        function update() {
            var y = window.scrollY || document.documentElement.scrollTop;
            var current = 0;
            sections.forEach(function (sec, i) {
                if (sec && sec.getBoundingClientRect().top <= 160) current = i;
            });
            links.forEach(function (a, i) { a.classList.toggle('is-active', i === current); });
            toTop.classList.toggle('is-show', y > 520);
        }
        window.addEventListener('scroll', update, { passive: true });
        update();
        toTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    }());

    /* ---------- 8. 作品分类筛选 ---------------------------------- */
    (function filterWorks() {
        var tabs = $$('#filterTabs .tab');
        var cards = $$('#worksGrid .work-card');
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                var key = tab.dataset.filter;
                tabs.forEach(function (t) {
                    var on = t === tab;
                    t.classList.toggle('is-active', on);
                    t.setAttribute('aria-pressed', String(on));
                });
                var visible = 0;
                cards.forEach(function (card) {
                    var show = key === 'all' || card.dataset.category === key;
                    card.classList.toggle('is-hidden', !show);
                    if (show) visible++;
                });
                var label = tab.textContent.trim();
                showToast('已筛选「' + label + '」，共 ' + visible + ' 个作品');
            });
        });
    }());

    /* ---------- 9. 作品详情弹窗 ---------------------------------- */
    (function modal() {
        var details = {
            1: {
                index: 'PROJECT 01 / HTML',
                title: '语义化自我介绍页',
                desc: '第一次 HTML5 作业：用 header / nav / main / section / article / footer 搭出页面骨架，再补齐课表表格、有序与无序列表、表单和引用。',
                points: ['HTML5 语义化标签与文档大纲', 'table 的 rowspan / colspan 合并单元格', 'form 表单控件与 HTML5 输入类型', '内部锚点链接与外部超链接']
            },
            2: {
                index: 'PROJECT 02 / CSS',
                title: '双栏布局练习',
                desc: '同一份内容做两遍：一遍用 position + float，一遍用 Flexbox + Grid，顺便对比两者在响应式下的表现。',
                points: ['容器 max-width 与自适应居中', 'float 图文环绕与清除浮动', 'Flexbox 实现水平导航', 'Grid 实现 70% / 30% 双栏']
            },
            3: {
                index: 'PROJECT 03 / JAVASCRIPT',
                title: '交互待办清单',
                desc: '不依赖任何框架，直接操作 DOM：添加、勾选、删除任务，并用 localStorage 保存，刷新后内容还在。',
                points: ['addEventListener 事件绑定', 'createElement / appendChild / remove', 'dataset 与 classList 状态管理', 'localStorage 读写 JSON 数据']
            },
            4: {
                index: 'PROJECT 04 / 综合',
                title: '个人主页（本页）',
                desc: '把结构、样式与交互串起来的阶段作品：打字机文字、渐变流光标题、滚动揭示、技能条、分类筛选与详情弹窗。',
                points: ['CSS 变量与浅色 / 深色双主题', 'IntersectionObserver 滚动动画', 'CSS keyframes 文字与装饰动画', '媒体查询实现移动端适配']
            }
        };
        var box = $('#workModal');
        var closeBtn = $('#modalClose');
        var lastFocus = null;

        function open(id) {
            var d = details[id];
            if (!d) return;
            lastFocus = document.activeElement;
            $('#modalIndex').textContent = d.index;
            $('#modalTitle').textContent = d.title;
            $('#modalDesc').textContent = d.desc;
            var list = $('#modalPoints');
            list.innerHTML = '';
            d.points.forEach(function (p) {
                var li = document.createElement('li');
                li.textContent = p;
                list.appendChild(li);
            });
            box.hidden = false;
            document.body.style.overflow = 'hidden';
            closeBtn.focus();
        }
        function close() {
            box.hidden = true;
            document.body.style.overflow = '';
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }
        $$('.detail-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { open(btn.dataset.work); });
        });
        // 整张卡片也可点击（按钮之外），方便触屏操作
        $$('#worksGrid .work-card').forEach(function (card) {
            card.addEventListener('click', function (e) {
                if (e.target.closest('.detail-btn')) return;
                open(card.dataset.work);
            });
        });
        closeBtn.addEventListener('click', close);
        $('[data-close-modal]', box).addEventListener('click', close);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !box.hidden) close();
        });
    }());

    /* ---------- 10. 浅色 / 深色主题切换 -------------------------- */
    (function theme() {
        var btn = $('#themeToggle');
        var label = $('#themeText');
        var saved = null;
        try { saved = localStorage.getItem('hh-theme'); } catch (e) { /* 隐私模式下忽略 */ }

        function apply(mode) {
            document.documentElement.setAttribute('data-theme', mode);
            var dark = mode === 'dark';
            label.textContent = dark ? '日间模式' : '夜间模式';
            btn.setAttribute('aria-pressed', String(dark));
        }
        apply(saved === 'dark' ? 'dark' : 'light');
        btn.addEventListener('click', function () {
            var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            apply(next);
            try { localStorage.setItem('hh-theme', next); } catch (e) { /* 忽略 */ }
            showToast(next === 'dark' ? '已切换到夜间模式' : '已切换到日间模式');
        });
    }());

    /* ---------- 11. 表单：HTML5 校验 + 本地保存 ------------------- */
    (function studyForm() {
        var form = $('#studyForm');
        if (!form) return;
        var hours = $('#hours'), out = $('#hoursOut'), tip = $('#formTip');
        var KEY = 'hh-study-plan';

        hours.addEventListener('input', function () { out.textContent = hours.value; });

        // 载入时回显上次保存的目标
        try {
            var old = JSON.parse(localStorage.getItem(KEY) || 'null');
            if (old && old.goal) {
                tip.textContent = '上次保存的本周目标：' + old.goal + '（' + old.course + '，约 ' + old.hours + ' 小时）';
                tip.classList.add('is-saved');
            }
        } catch (e) { /* 数据损坏时忽略 */ }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!form.checkValidity()) { form.reportValidity(); return; }
            var data = new FormData(form);
            var plan = {
                goal: (data.get('goal') || '').trim(),
                mood: data.get('mood') || '',
                course: data.get('course') || '',
                ways: data.getAll('way'),
                date: data.get('planDate') || '',
                hours: data.get('hours') || '',
                email: data.get('email') || '',
                note: data.get('note') || ''
            };
            try { localStorage.setItem(KEY, JSON.stringify(plan)); } catch (e) { /* 忽略 */ }
            tip.textContent = '已保存：' + plan.goal + ' · ' + plan.course + ' · 约 ' + plan.hours + ' 小时（数据仅存本机）';
            tip.classList.add('is-saved');
            showToast('保存成功，本周计划已记下');
        });

        form.addEventListener('reset', function () {
            setTimeout(function () {
                out.textContent = hours.value;
                tip.textContent = '表单已重置。表单数据只保存在本机浏览器，不会上传到任何服务器。';
                tip.classList.remove('is-saved');
            }, 0);
        });
    }());

    /* ---------- 12. 轻提示 toast --------------------------------- */
    var toastTimer = null;
    window.showToast = function (msg) {
        var el = $('#toast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('is-show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.classList.remove('is-show'); }, 2200);
    };
}());
