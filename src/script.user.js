// ==UserScript==
// @name         体检系统辅助
// @namespace    http://tampermonkey.net/
// @version      AUTO_INCREMENTED_VERSION
// @description  监控特定元素属性的变化，并根据变化执行相应的操作。
// @author       太公摘花
// @match        https://wx.changx.com/*
// @grant        none
// @require      https://code.jquery.com/jquery-3.7.1.js
// @updateURL    AUTO_UPDATE_URL
// @downloadURL  AUTO_DOWNLOAD_URL
// ==/UserScript==

(function () {
    'use strict';

    let tab0Observer = null; // 标签页1的观察者对象
    let tab1Observer = null; // 标签页1的观察者对象
    let tab2Observer = null; // 标签页2的观察者对象

    /**
     * 设置元素属性变化的观察者
     * 
     * @param {string} selector - jQuery选择器，用于定位需要监控的元素
     * @param {Object} config - 观察者配置对象
     * @param {Function} callback - 当属性变化时执行的回调函数
     * @returns {MutationObserver} - 返回创建的MutationObserver对象
     * @example
     * setupObserver('#tab-0', { attributes: true, attributeFilter: ['tabindex'] }, performTab0Actions);
     * setupObserver('#tab-1', { attributes: true, attributeFilter: ['tabindex'] }, performTab1Actions);
     * setupObserver('#tab-2', { attributes: true, attributeFilter: ['tabindex'] }, performTab2Actions);
     * ...
     * @see {@link https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver}
     */
    function setupObserver(selector, config, callback) {
        const element = $(selector);
        if (element.length) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => callback($(mutation.target)));
            });

            observer.observe(element[0], config);
            return observer;
        } else {
            setTimeout(() => setupObserver(selector, config, callback), 500);
        }
    }

    /**
     * 监控对话框的显示与隐藏状态
     * 
     * @param {string} selector - jQuery选择器，用于定位需要监控的元素
     * @returns {void} - 无返回值
     * @example
     * monitorDialog('.el-dialog__wrapper.page-dialog.all-test-dialog');
     * ...
     */
    function monitorDialog(selector) {
        const observerConfig = {
            attributes: true,
            attributeFilter: ['style'] // 只监控style属性
        };

        setupObserver(selector, observerConfig, (element) => {
            const display = element.css('display');
            if (display !== 'none') {
                console.log('对话框显示，启动标签页监控...');
                startTabMonitoring();
            } else {
                console.log('对话框隐藏，断开标签页监控...');
                stopTabMonitoring();
            }
        });
    }

    /**
     * 监控单个元素属性变化
     * 
     * @param {string} selector - jQuery选择器，用于定位需要监控的元素
     * @param {string} attribute - 监控的属性
     * @param {Function} action - 当属性变化符合条件时执行的操作
     * @returns {MutationObserver|null} 返回创建的MutationObserver对象或null
     * @example
     * setupElementObserver('#tab-0', 'tabindex', 0, performTab0Actions);
     * setupElementObserver('#tab-1', 'tabindex', 0, performTab1Actions);
     * setupElementObserver('#tab-2', 'tabindex', 0, performTab2Actions);
     * ...
     */
    function setupElementObserver(selector, attribute, value, action) {
        return waitForElement(selector).then((element) => {
            if (element.attr(attribute) === value) {
                action();
            }
            return setupObserver(selector, {
                attributes: true,
                attributeFilter: [attribute]
            }, (element) => {
                if (element.attr(attribute) === value) {
                    action();
                }
            });
        });

    }

    /**
     * 模拟指定标题的下拉框选择指定选项
     * 
     * @param {string} title - 下拉框标题
     * @param {string} option - 选项
     * @returns {Promise<{success: boolean, message: string}>} - 返回一个Promise对象，包含操作结果
     * @throws {Error} - 如果参数不符合要求，将抛出异常
     * @example
     * selectDropdownOption('尿蛋白', '阴性').then(result => {
     *   if (result.success) {
     *    console.log(result.message);
     *  } else {
     *   console.error(result.message);
     * }
     * });
     */
    async function selectDropdownOption(title, option) {
        if (typeof title !== 'string' || typeof option !== 'string') {
            throw new Error('标题和选项参数必须是字符串。');
        }

        try {
            console.log(`正在查找标题为 "${title}" 的下拉框。`);
            const labelDiv = await waitFor(() => $(`div.el-form-item__content`).filter(function () {
                // 忽略空格和大小写，查找匹配的选项
                return $.trim($(this).text()) === title;
            }));

            if (labelDiv.length === 0 || labelDiv.find('input').val() !== '') {
                return { success: false, message: `未找到未选值的标题为"${title}"的下拉框。` };
            }

            console.log(`找到未选值的下拉框，触发 "${title}" 下拉菜单。`);
            labelDiv.children().first().click();

            console.log(`正在等待 "${title}" 下拉菜单选项出现。`);
            const placementDiv = await waitFor('div[x-placement="bottom-start"]');
            const listItem = placementDiv.find('li').filter((i, elem) => $.trim($(elem).text()) === option);

            if (listItem.length === 0) {
                return { success: false, message: `未找到选项 "${option}"。` };
            }

            listItem.click();
            await waitFor(() => labelDiv.find('input'), input => input.val() === option && placementDiv.css('display') === 'none');

            console.log(`选项 "${option}" 已成功选择，下拉菜单已关闭。`);
            return { success: true, message: `选项 "${option}" 已成功选择。` };
        } catch (error) {
            console.error(`在选择 ${title} 时发生错误: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    /**
     * 
     * 等待元素出现，并满足条件
     * 
     * @summary 等待元素出现，并满足条件
     * 
     * @param {string|Function} selector - jQuery选择器或返回jQuery对象的函数 
     * @param {Function} condition - 检查条件的函数
     * @param {number} timeout - 超时时间
     * @param {number} interval - 检查间隔
     * @returns {Promise<jQuery>} - 返回一个Promise对象，包含满足条件的jQuery对象
     * @throws {Error} - 如果参数不符合要求，将抛出异常
     * @example
     * waitFor('div#myDiv', $div => $div.is(':visible')).then($div => {
     *    console.log('元素已可见。');
     * });
     * waitFor(() => $('div#myDiv'), $div => $div.is(':visible')).then($div => {
     *   console.log('元素已可见。');
     * }
     * ...
     * @see {@link https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise}
     * @see {@link https://api.jquery.com/jQuery/}
     */
    async function waitFor(selector, condition = () => true, timeout = 30000, interval = 100) {

        return new Promise((resolve, reject) => {
            if (typeof selector !== 'string' && typeof selector !== 'function') {
                reject(new Error('参数selector必须是字符串或返回jQuery对象的函数。'));
            }
            if (typeof condition !== 'function') {
                reject(new Error('condition不是一个有效的function。'));
            }
            if (typeof timeout !== 'number' || typeof interval !== 'number') {
                reject(new Error('timeout和interval必须为number。'));
            }

            const startTime = Date.now();

            // 检查条件是否满足
            function checkCondition() {
                let $element = typeof selector === 'function' ? selector() : $(selector);
                if (!($element instanceof jQuery)) {
                    reject(new Error("选择器或函数没有返回一个jQuery对象。"));
                }

                // 检查jQuery选择器是否存在且满足条件，满足则返回一个jQuery对象，否则继续等待，直到超时
                if ($element.length > 0 && condition($element)) {
                    resolve($element);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('等待条件满足超时。'));
                } else {
                    setTimeout(checkCondition, interval);
                }
            }

            checkCondition();
        });
    }

    /**
     * 模拟点击指定选择器的每一个元素
     * 
     * @param {string} selector - jQuery选择器，指定需要模拟点击的元素
     * @returns {void} - 无返回值
     * @example
     * simulateClick('input[type="radio"]');
     * simulateClick('input[type="checkbox"]');
     * ...
     */
    function simulateClick(selector) {
        $(selector).each(function () {
            var $label = $(this).closest('label');
            clickUncheckedLabel($label)
        });
    }

    /**
     * 点击未被选中的标签
     * 
     * @param {jQuery} label - jQuery对象，表示需要点击的标签
     * @returns {void} - 无返回值
     * @example
     * clickUncheckedLabel($('label'));
     * clickUncheckedLabel($('label').first());
     * clickUncheckedLabel($('label').eq(1));
     * ...
     */
    function clickUncheckedLabel(label) {
        if (!label.parents("tr").find('label.is-checked').length) {
            label.click(); // 如果没有选中的标签，进行点击
        } else {
            console.log('已存在被选中的标签，跳过当前操作');
        }
    }

    /**
     * 启动标签页监控
     * 
     * @returns {void} - 无返回值
     */
    function startTabMonitoring() {
        tab0Observer = setupElementObserver('#tab-0', 'tabindex', 0, performTab0Actions);
        tab1Observer = setupElementObserver('#tab-1', 'tabindex', 0, performTab1Actions);
        tab2Observer = setupElementObserver('#tab-2', 'tabindex', 0, performTab2Actions);
    }

    /**
     * 停止标签页监控
     * 
     * @returns {void} - 无返回值
     */
    function stopTabMonitoring() {
        if (tab0Observer) {
            tab0Observer.disconnect(); // 断开连接
            tab0Observer = null;
        }
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
     * 执行标签页0的相关操作
     * 
     * @returns {void} - 无返回值
     */
    async function performTab0Actions() {
        let urinalysisItems = ["尿蛋白", "尿糖", "尿酮体", "尿潜血", "白细胞"];

        for (let item of urinalysisItems) {
            try {
                let result = await selectDropdownOption(item, "-");
                if (result.success) {
                    console.log(`"${item}"选值成功：${result.message}`);
                } else {
                    console.log(`"${item}"未能成功选值：${result.message}`);
                }

            } catch (error) {
                console.error(`在选择 ${item} 时发生错误: ${error.message}`);
            }
        }
    }

    /**
     * 执行标签页1的相关操作
     * 
     * @returns {void} - 无返回值
     */
    function performTab1Actions() {
        console.log('标签页 1 激活，执行操作...');
        simulateClick('div#pane-1 input[type="radio"][value="1"]');
        clickUncheckedLabel($('div#pane-1 input[type="radio"][value="4"]').first().closest('label'));
    }

    /**
     * 执行标签页2的相关操作
     * 
     * @returns {void} - 无返回值
     */
    function performTab2Actions() {
        console.log('标签页 2 激活，执行操作...');
        simulateClick('div#pane-2 input[type="radio"][value="0"]');
    }

    // 监控对话框的显示与隐藏状态
    $(document).ready(() => {
        monitorDialog('.el-dialog__wrapper.page-dialog.all-test-dialog');
    });

})();
