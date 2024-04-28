// ==UserScript==
// @name         体检系统辅助
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  监控特定元素属性的变化，并根据变化执行相应的操作。
// @author       太公摘花
// @match        https://wx.changx.com/*
// @grant        none
// @require      https://code.jquery.com/jquery-3.7.1.js
// @updateURL    https://raw.githubusercontent.com/taigongzhaihua/TampermonkeyTJFZXT/blob/main/dist/your-script.meta.js
// @downloadURL  https://raw.githubusercontent.com/taigongzhaihua/TampermonkeyTJFZXT/blob/main/dist/your-script.user.js
// ==/UserScript==

(function() {
    'use strict';

    let tab1Observer = null; // 标签页1的观察者对象
    let tab2Observer = null; // 标签页2的观察者对象

    $(document).ready(() => {
        monitorDialog('.el-dialog__wrapper.page-dialog.all-test-dialog');
    });

    /**
     * 监控对话框的显示与隐藏状态
     * @param {string} selector - jQuery选择器，用于定位需要监控的元素
     */
    function monitorDialog(selector) {
        const observerConfig = {
            attributes: true,
            attributeFilter: ['style'] // 只监控style属性
        };

        const elementFound = $(selector);
        if (elementFound.length) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    const displayStyle = $(mutation.target).css('display');
                    if (displayStyle !== 'none') {
                        console.log('对话框显示，启动标签页监控...');
                        startTabMonitoring();
                    } else if (displayStyle === 'none') {
                        console.log('对话框隐藏，断开标签页监控...');
                        stopTabMonitoring();
                    }
                });
            });

            observer.observe(elementFound[0], observerConfig);
        } else {
            setTimeout(() => monitorDialog(selector), 500); // 如果未找到元素，500ms后再次尝试
        }
    }

    /**
     * 启动标签页监控
     */
    function startTabMonitoring() {
        tab1Observer = monitorElement('#tab-1', 'tabindex', performTab1Actions);
        tab2Observer = monitorElement('#tab-2', 'tabindex', performTab2Actions);
    }

    /**
     * 停止标签页监控
     */
    function stopTabMonitoring() {
        if (tab1Observer) {
            tab1Observer.disconnect(); // 断开连接
            tab1Observer = null;
        }
        if (tab2Observer) {
            tab2Observer.disconnect();
            tab2Observer = null;
        }
    }

    /**
     * 监控单个元素属性变化
     * @param {string} selector - jQuery选择器，用于定位需要监控的元素
     * @param {string} attribute - 监控的属性
     * @param {Function} action - 当属性变化符合条件时执行的操作
     * @returns {MutationObserver|null} 返回创建的MutationObserver对象或null
     */
    function monitorElement(selector, attribute, action) {
        const observerConfig = {
            attributes: true,
            attributeFilter: [attribute]
        };

        const elementFound = $(selector);
        if (elementFound.length) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if ($(mutation.target).attr(attribute) === '0') {
                        action(); // 当属性变为'0'时执行操作
                    }
                });
            });

            observer.observe(elementFound[0], observerConfig);
            return observer;
        } else {
            setTimeout(() => monitorElement(selector, attribute, action), 500); // 如果未找到元素，500ms后再次尝试
            return null;
        }
    }

    /**
     * 执行标签页1的相关操作
     */
    function performTab1Actions() {
        console.log('标签页 1 激活，执行操作...');
        simulateClick('div#pane-1 input[type="radio"][value="1"]');
        clickUncheckedLabel($('div#pane-1 input[type="radio"][value="4"]').first().closest('label'));
    }

    /**
     * 执行标签页2的相关操作
     */
    function performTab2Actions() {
        console.log('标签页 2 激活，执行操作...');
        simulateClick('div#pane-2 input[type="radio"][value="0"]');
    }

    /**
     * 模拟点击指定选择器的每一个元素
     * @param {string} selector - jQuery选择器，指定需要模拟点击的元素
     */
    function simulateClick(selector) {
        $(selector).each(function(){
            var $label = $(this).closest('label');
            clickUncheckedLabel($label)
        });
    }

    /**
     * 点击未被选中的标签
     * @param {jQuery} label - jQuery对象，表示需要点击的标签
     */
    function clickUncheckedLabel(label) {
        if (!label.parents("tr").find('label.is-checked').length) {
            label.click(); // 如果没有选中的标签，进行点击
        } else {
            console.log('已存在被选中的标签，跳过当前操作');
        }
    }

})();
