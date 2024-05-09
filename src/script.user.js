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

    // 监控对话框的显示与隐藏状态
    $(document).ready(() => {
        addObservers(tabsManager, actions);
        monitorDialog('.el-dialog__wrapper.page-dialog.all-test-dialog');
    });

})();

class DOMUtils {
    /**
     * @summary 模拟指定标题的下拉框选择指定选项
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
    static async selectDropdownOption(title, option) {
        if (typeof title !== 'string' || typeof option !== 'string') {
            throw new Error('标题和选项参数必须是字符串。');
        }

        try {
            console.log(`正在查找标题为 "${title}" 的下拉框。`);
            const labelDiv = await this.waitFor(() => $(`div.el-form-item__content`).filter(function () {
                return $.trim($(this).text().replaceAll(" ", "").replaceAll("+", "").replaceAll("-", "")) === title;
            }));

            if (labelDiv.length === 0) {
                return { success: false, message: `未找到"${title}"下拉框。` };
            } else if (labelDiv.find('input').val() !== '') {
                return { success: false, message: `"${title}"下拉框已选值。` };
            }

            console.log(`找到未选值的下拉框，触发 "${title}" 下拉菜单。`);
            labelDiv.children().first().click();

            console.log(`正在等待 "${title}" 下拉菜单选项出现。`);
            const placementDiv = await this.waitFor(
                'div[x-placement="bottom-start"], div[x-placement="top-start"]',
                () => true,
                5000,
                100,
                () => {
                    console.log(`"${title}" 下拉菜单未出现，重新尝试打开。`);
                    labelDiv.children().first().click();
                    return DOMUtils.waitFor('div[x-placement="bottom-start"]');
                }
            );

            const listItem = placementDiv.find('li').filter((i, elem) => $.trim($(elem).text()) === option);

            if (listItem.length === 0) {
                return { success: false, message: `未找到选项 "${option}"。` };
            }

            listItem.click();
            await this.waitFor(() => labelDiv.find('input'), input => input.val() === option && placementDiv.css('display') === 'none');

            console.log(`选项 "${option}" 已成功选择，下拉菜单已关闭。`);
            return { success: true, message: `选项 "${option}" 已成功选择。` };
        } catch (error) {
            console.error(`在选择 ${title} 时发生错误: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    /**
     * @summary 模拟点击指定选择器的每一个元素
     * 
     * @param {string} selector - jQuery选择器，指定需要模拟点击的元素
     * @returns {void} - 无返回值
     * @example
     * simulateClick('input[type="radio"]');
     * simulateClick('input[type="checkbox"]');
     * ...
     */
    static simulateClick(selector) {
        $(selector).each(function () {
            var $label = $(this).closest('label');
            DOMUtils.clickUncheckedLabel($label)
        });
    }

    /**
    * @summary 点击未被选中的标签
    * 
    * @param {jQuery} label - jQuery对象，表示需要点击的标签
    * @returns {void} - 无返回值
    * @example
    * clickUncheckedLabel($('label'));
    * clickUncheckedLabel($('label').first());
    * clickUncheckedLabel($('label').eq(1));
    * ...
    */
    static clickUncheckedLabel(label) {
        if (!label.parents("tr").find('label.is-checked').length) {
            label.click(); // 如果没有选中的标签，进行点击
        } else {
            console.log('已存在被选中的标签，跳过当前操作');
        }
    }

    /**
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
    static waitFor(
        selector,
        condition = () => true,
        timeout = 30000,
        interval = 100,
        callbackIfTimeout = () => { throw new Error('等待超时。'); }
    ) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            function checkCondition() {
                let $element = typeof selector === 'function' ? selector() : $(selector);
                if (!($element instanceof jQuery)) {
                    return reject(new Error(`"selector" 参数无法获取一个正确的 jQuery 对象，请检查参数。`));
                }

                // 检查条件是否满足
                if ($element.length > 0 && condition($element)) {
                    resolve($element);
                } else if (Date.now() - startTime > timeout) {
                    try {
                        const result = callbackIfTimeout();
                        if (result instanceof Promise) {
                            result.then(resolve).catch(reject);
                        } else {
                            reject(new Error('等待超时。'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    setTimeout(checkCondition, interval);
                }
            }

            checkCondition();
        });
    }


    /**
     * @summary 设置元素属性变化的观察者
     * 
     * @param {string} selector - jQuery选择器，用于定位需要监控的元素
     * @param {Object} config - 观察者配置对象
     * @param {Function} callback - 当属性变化时执行的回调函数
     * @returns {Promise<MutationObserver>} - 返回一个Promise对象，包含创建的MutationObserver对象
     * @example
     * setupObserver('#tab-0', { attributes: true, attributeFilter: ['tabindex'] }, performTab0Actions);
     * setupObserver('#tab-1', { attributes: true, attributeFilter: ['tabindex'] }, performTab1Actions);
     * setupObserver('#tab-2', { attributes: true, attributeFilter: ['tabindex'] }, performTab2Actions);
     * ...
     * @see {@link https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver}
     */
    static creatObserver(callback) {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => callback($(mutation.target)));
        });
        return observer;
    }
}

/**
 * @summary 监控特定元素属性的变化，并根据变化执行相应的操作。
 * 
 * @class ElementObserver
 * @example
 * const observer = new ElementObserver('#tab-0', 'tabindex', 0, performTab0Actions);
 * observer.start();
 * ...
 */
class ElementObserver {
    /**
     * @summary 创建一个ElementObserver实例
     * 
     * @param {string} selector - jQuery选择器，用于定位需要监控的元素
     * @param {string} attribute - 需要监控的属性
     * @param {string|number} value - 属性的值
     * @param {Function} action - 当属性变化时执行的回调函数
     * @example
     * const observer = new ElementObserver('#tab-0', 'tabindex', 0, performTab0Actions);
     * ...
     * @see {@link https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver}
     */
    constructor(selector, attribute, value, action) {
        this.selector = selector;
        this.attribute = attribute;
        this.value = value;
        this.action = action;
        this.observer = null;
    }

    /**
     * @summary 启动监控
     * 
     * @returns {Promise<void>} - 返回一个Promise对象
     * @example
     * observer.start();
     * ...
     */
    async start() {
        const $element = await DOMUtils.waitFor(this.selector);
        // 初始化时执行一次回调函数
        this.#runAction($element);
        if (!this.observer) {
            this.observer = DOMUtils.creatObserver(this.#runAction.bind(this));
        }
        this.observer.observe(
            $element[0],
            {
                attributes: true,
                attributeFilter: [this.attribute]
            }
        );
        console.log('监控已启动。');
    }

    /**
     * @summary 停止监控
     * 
     * @returns {void} - 无返回值
     * @example
     * observer.stop();
     * ...
     * @see {@link https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver/disconnect}
     */
    stop() {
        if (this.observer) {
            this.observer.disconnect();
        } else {
            console.warn('监控未定义，无需停止。');
        }
    }

    /**
     * @summary 重置监控
     * 
     * @returns {void} - 无返回值
     * @example
     * observer.reset();
     * ...
     */
    reset() {
        this.stop();
        this.observer = null;
        this.selector = null;
        this.attribute = null;
        this.value = null;
        this.action = null;
    }

    /**
     * @summary 执行回调函数
     * 
     * @private
     * @param {jQuery} $element - jQuery对象，表示需要执行回调函数的元素
     * @returns {void} - 无返回值
     * @example
     * #runAction($element);
     * ...
     */
    #runAction($element) {
        if ($element.attr(this.attribute) == this.value) {
            this.action($element);
        }
    }
}

class ObserverManager {

    /**
     * 创建一个 ObserverManager 实例
     */
    constructor() {
        this.observers = new Map();
    }

    /**
     * @summary 添加一个观察者
     * 
     * @param {string} id - 观察者的 ID
     * @param {ElementObserver} observer - ElementObserver 实例
     * @returns {void} - 无返回值
     * @example
     * add('tab0', observer);
     * ...
     */
    add(id, observer) {
        if (this.observers.has(id)) {
            console.warn(`已存在 ID 为 ${id} 的观察者, 请勿重复添加。`);
        } else {
            this.observers.set(id, observer);
        }
    }

    /**
     * @summary 移除一个观察者
     * 
     * @param {string} id - 观察者的 ID
     * @returns {void} - 无返回值
     * @example
     * remove('tab0');
     * ...
     */
    remove(id) {
        if (this.observers.has(id)) {
            this.observers.get(id).reset();
            this.observers.delete(id);
        }
    }

    /**
     * @summary 启动指定观察者
     * 
     * @param {string} id - 观察者的 ID
     * @returns {void} - 无返回值
     * @example
     * start('tab0');
     * ...
     */
    start(id) {
        if (this.observers.has(id)) {
            this.observers.get(id).start();
        }
    }

    /**
     * @summary 停止指定观察者
     * 
     * @param {string} id - 观察者的 ID
     * @returns {void} - 无返回值
     * @example
     * stop('tab0');
     * ...
     */
    stop(id) {
        if (this.observers.has(id)) {
            this.observers.get(id).stop();
        }
    }

    /**
     * @summary 启动所有观察者
     * 
     * @returns {void} - 无返回值
     * @example
     * startAll();
     * ...
     */
    startAll() {
        this.observers.forEach(observer => observer.start());
    }

    /**
     * @summary 停止所有观察者
     * 
     * @returns {void} - 无返回值
     * @example
     * stopAll();
     * ...
     */
    stopAll() {
        this.observers.forEach(observer => observer.stop());
    }

    /**
     * @summary 移除所有观察者
     * 
     * @returns {void} - 无返回值
     * @example
     * removeAll();
     * ...
     */
    removeAll() {
        this.observers.forEach(observer => observer.stop());
        this.observers.clear();  // 使用 Map 的 clear 方法清空所有键值对
    }
}

// 定义标签页操作
const actions = {

    // 标签页 0 的操作
    performTab0Actions: async () => {
        let urinalysisItems = ["尿蛋白", "尿糖", "尿酮体", "尿潜血", "白细胞"];

        // 逐个选择下拉框选项
        for (let item of urinalysisItems) {
            try {
                let result = await DOMUtils.selectDropdownOption(item, "-");
                if (result.success) {
                    console.log(`"${item}"选值成功：${result.message}`);
                } else {
                    console.log(`"${item}"选值失败：${result.message}`);
                }
            } catch (error) {
                console.error(`在选择 ${item} 时发生错误: ${error.message}`);
            }
        }
    },

    // 标签页 1 的操作
    performTab1Actions: () => {
        console.log('标签页 1 激活，执行操作...');
        DOMUtils.simulateClick('div#pane-1 input[type="radio"][value="1"]');
        DOMUtils.clickUncheckedLabel($('div#pane-1 input[type="radio"][value="4"]').first().closest('label'));
    },

    // 标签页 2 的操作
    performTab2Actions: () => {
        console.log('标签页 2 激活，执行操作...');
        DOMUtils.simulateClick('div#pane-2 input[type="radio"][value="0"]');
    }
};

// 创建观察者管理器
const tabsManager = new ObserverManager();

/**
 * @summary 添加观察者
 * 
 * @param {ObserverManager} manager - 观察者管理器
 * @param {Object} actions - 操作对象
 * @returns {void} - 无返回值
 * @example
 * addObservers(tabsManager, actions);
 * ...
 */
function addObservers(manager, actions) {
    Object.keys(actions).forEach((key, index) => {
        const observer = new ElementObserver(`#tab-${index}`, 'tabindex', 0, actions[key]);
        manager.add(`tab${index}`, observer);
    });
}

/**
 * @summary 监控对话框的显示与隐藏状态
 * 
 * @param {string} selector - jQuery选择器，用于定位需要监控的元素
 * @returns {void} - 无返回值
 * @example
 * monitorDialog('.el-dialog__wrapper.page-dialog.all-test-dialog');
 * ...
 */
async function monitorDialog(selector) {
    const element = await DOMUtils.waitFor(selector);
    const observerConfig = {
        attributes: true,
        attributeFilter: ['style'] // 只监控style属性
    };

    const monitor = DOMUtils.creatObserver((element) => {
        const display = element.css('display');
        if (display !== 'none') {
            console.log('对话框显示，3秒后启动标签页监控...');
            setTimeout(() => {
                tabsManager.startAll();
            }, 3000);
        } else {
            console.log('对话框隐藏，断开标签页监控...');
            tabsManager.stopAll();
        }
    });
    monitor.observe(element[0], observerConfig);
}
