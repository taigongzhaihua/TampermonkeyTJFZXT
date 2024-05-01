// ==UserScript==
// @name         体检系统辅助
// @namespace    http://tampermonkey.net/
// @version      0.1.19
// @description  监控特定元素属性的变化，并根据变化执行相应的操作。
// @author       太公摘花
// @match        https://wx.changx.com/*
// @grant        none
// @require      https://code.jquery.com/jquery-3.7.1.js
// @updateURL    https://raw.githubusercontent.com/taigongzhaihua/TampermonkeyTJFZXT/main/dist/script-last.meta.js
// @downloadURL  https://raw.githubusercontent.com/taigongzhaihua/TampermonkeyTJFZXT/main/dist/script-last.user.js
// ==/UserScript==

(function () {
    'use strict';

    let tab0Observer = null; // 标签页1的观察者对象
    let tab1Observer = null; // 标签页1的观察者对象
    let tab2Observer = null; // 标签页2的观察者对象

    // 监控对话框的显示与隐藏状态
    $(document).ready(() => {
        monitorDialog('.el-dialog__wrapper.page-dialog.all-test-dialog');
    });

    /**
     * 监控对话框的显示与隐藏状态
     * 
     * @param {string} selector - jQuery选择器，用于定位需要监控的元素
     * @returns {void} - 无返回值
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
     * 
     * @returns {void} - 无返回值
     */
    function startTabMonitoring() {
        tab0Observer = monitorElement('#tab-0', 'tabindex', performTab0Actions);
        tab1Observer = monitorElement('#tab-1', 'tabindex', performTab1Actions);
        tab2Observer = monitorElement('#tab-2', 'tabindex', performTab2Actions);
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
     * 监控单个元素属性变化
     * 
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
     * 执行标签页0的相关操作
     * 
     * @returns {void} - 无返回值
     */
    async function performTab0Actions() {
        let urinalysisItems = [
            "尿蛋白",
            "尿糖",
            "尿酮体",
            "尿潜血",
            "白细胞"
        ];
        for (let i = 0; i < urinalysisItems.length; i++) {
            // 等待每次下拉选项选择完成后再进行下一次选择
            await selectDropdownOption(urinalysisItems[i], "-")
                .then(result => {
                    console.log(`成功选择 ${urinalysisItems[i]}: ${result}`);
                })
                .catch(error => {
                    console.error(`在选择 ${urinalysisItems[i]} 时发生错误: ${error.message}`);
                });
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

    /**
     * 模拟点击指定选择器的每一个元素
     * 
     * @param {string} selector - jQuery选择器，指定需要模拟点击的元素
     * @returns {void} - 无返回值
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
     */
    function clickUncheckedLabel(label) {
        if (!label.parents("tr").find('label.is-checked').length) {
            label.click(); // 如果没有选中的标签，进行点击
        } else {
            console.log('已存在被选中的标签，跳过当前操作');
        }
    }

    /**
     * 定义一个异步函数 selectDropdownOption，
     * 用于模拟点击指定下拉框标签的指定选项。
     * 
     * @async
     * @param {string} title - 标签名
     * @param {string} option - 要点击的选项
     * @returns {void} - 无返回值
     */
    async function selectDropdownOption(title, option) {
        // 检查 title 和 option 是否是字符串，如果不是，抛出错误
        if (typeof title !== 'string' || typeof option !== 'string') {
            throw new Error('标题和选项参数必须是字符串。');
        }

        try {
            console.log(`正在查找标题为 "${title}" 的元素。`);
            const labelDiv = await waitForElement(`div.el-form-item__content:contains('${title}')`);

            // 如果没有找到元素，抛出错误
            if (labelDiv.length === 0) {
                throw new Error(`未找到标题为"${title}"的元素。`);
            }

            
            if(labelDiv.find('input[value=""]').length) {
                console.log(`正在触发 "${title}" 下拉菜单。`);
            labelDiv.children().first().click();
            } else {
                console.log(`"${title}" 下拉框已存在值，跳过当前操作。`);
                return;
            }

            console.log(`正在等待 "${title}" 下拉菜单选项出现。`);
            const placementDiv = await waitForElement('div[x-placement="bottom-start"]');
            const listItem = placementDiv.find('li.el-select-dropdown__item').filter(function () {
                // 忽略空格和大小写，查找匹配的选项
                return $.trim($(this).text()).toLowerCase() === option.trim().toLowerCase();
            });

            // 如果没有找到选项，抛出错误
            if (listItem.length === 0) {
                throw new Error(`未找到文本为"${option}"的选项。`);
            }

            console.log(`已选择 "${option}"。`);
            listItem.click();

            // 返回成功的结果
            return { success: true, message: `选项 "${option}" 已成功选择。` };
        } catch (error) {
            console.error("错误:", error.message);
            throw error; // 将错误向上抛出，以便外部可以捕获
        }
    }


    /**
     * 等待元素出现
     * @param {string} selector - jQuery选择器
     * @param {number} timeout - 超时时间
     * @returns {Promise<jQuery>} - 返回一个Promise对象，包含一个jQuery对象
     */
    function waitForElement(selector, timeout = 30000) {
        return new Promise((resolve, reject) => {
            // 先检查元素是否已存在
            const existingElements = $(selector);
            if (existingElements.length > 0) {
                console.log(`元素已存在: ${selector}`);
                resolve(existingElements);
                return;
            }

            // 使用 MutationObserver 监听后续变化
            const observer = new MutationObserver((mutations) => {
                const elements = $(selector);
                if (elements.length > 0) {
                    observer.disconnect();
                    console.log(`已找到元素: ${selector}`);
                    resolve(elements);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            // 设置超时以防止无限等待
            const timeoutId = setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout waiting for element: ${selector}`));
            }, timeout);

            // 确保在成功后清除超时定时器
            observer.disconnect = ((disconnectOriginal) => {
                return () => {
                    clearTimeout(timeoutId);
                    disconnectOriginal.call(observer);
                };
            })(observer.disconnect);
        });
    }


})();
