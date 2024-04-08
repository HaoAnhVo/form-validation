function Validator(options) {
    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    var selectorRules = {};

    // Hàm thực hiện validate
    function validate(inputElement, rule) {
        var errorElement = getParent(
            inputElement,
            options.formGroupSelector
        ).querySelector(options.errorSelector);
        var errorMessage;

        // Lấy ra các rules của selector
        var rules = selectorRules[rule.selector];

        // Lặp qua từng rule và kiểm tra
        // Nếu có lỗi thì dừng viêc kiểm tra
        for (var i = 0; i < rules.length; i++) {
            switch (inputElement.type) {
                case "radio":
                case "checkbox":
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ":checked")
                    );
                    break;

                default:
                    errorMessage = rules[i](inputElement.value);
            }

            if (errorMessage) break;
        }

        if (errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add(
                "invalid"
            );
        } else {
            errorElement.innerText = "";
            getParent(inputElement, options.formGroupSelector).classList.remove(
                "invalid"
            );
        }

        return errorMessage;
    }
    // Lấy element của form cần validate
    var formElement = document.querySelector(options.form);
    if (formElement) {
        // Khi submit form
        formElement.addEventListener("submit", function (e) {
            e.preventDefault();

            isFormInvalid = false;

            // Lặp qua từng rule và validate
            options.rules.forEach(function (rule) {
                var inputElement = formElement.querySelector(rule.selector);
                var valid = validate(inputElement, rule);

                if (valid) {
                    isFormInvalid = true;
                }
            });

            if (isFormInvalid) {
            } else {
                // Trường hợp submit với javascript
                if (typeof options.onSubmit === "function") {
                    var enableInputs = formElement.querySelectorAll("[name]");
                    var formValues = Array.from(enableInputs).reduce(
                        (values, input) => {
                            switch (input.type) {
                                case "radio":
                                    values[input.name] =
                                        formElement.querySelector(
                                            'input[name="' +
                                                input.name +
                                                '"]:checked'
                                        ).value;
                                    break;
                                case "checkbox":
                                    if (!Array.isArray(values[input.name])) {
                                        values[input.name] = [];
                                    }
                                    if (input.matches(":checked")) {
                                        values[input.name].push(input.value);
                                    }

                                    break;
                                case "file":
                                    values[input.name] = input.files;
                                    break;

                                default:
                                    values[input.name] = input.value;
                            }
                            return values;
                        },
                        {}
                    );
                    options.onSubmit(formValues);
                }
                // Trường hợp submit với hành vi mặc định
                else {
                    formElement.submit();
                }
            }
        });

        // Lặp qua mỗi rule và xử lý (lắng nghe sự kiện blur, input,...)
        options.rules.forEach(function (rule) {
            // Lưu lại các rules cho mỗi input
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            var inputElements = formElement.querySelectorAll(rule.selector);

            Array.from(inputElements).forEach(function (inputElement) {
                inputElement.onblur = function () {
                    // Nhận được value từ người dùng -> inputElement.value
                    // Hàm rule.test(inputElement.value) -> Kiểm tra giá trị người dùng nhập vào input
                    validate(inputElement, rule);
                };

                // Xử lý mỗi khi người dùng nhập vào input
                inputElement.oninput = function () {
                    var errorElement = getParent(
                        inputElement,
                        options.formGroupSelector
                    ).querySelector(options.errorSelector);
                    errorElement.innerText = "";
                    getParent(
                        inputElement,
                        options.formGroupSelector
                    ).classList.remove("invalid");
                };
            });
        });
    }
}

// Định nghĩa rules
// Nguyên tắc của các rules
// 1. Khi có lỗi => Trả ra message lỗi
// 2. Khi hợp lê => Không trả ra gì cả (undefine)
Validator.isRequired = function (selector, message) {
    return {
        selector,
        test(value) {
            return value ? undefined : message || "Vui lòng nhập trường này";
        },
    };
};

Validator.isEmail = function (selector, message) {
    return {
        selector,
        test(value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value)
                ? undefined
                : message || "Trường này phải là email";
        },
    };
};

Validator.minLength = function (selector, min) {
    return {
        selector,
        test(value) {
            return value.length >= min
                ? undefined
                : `Vui lòng nhập tối thiểu ${min} kí tự`;
        },
    };
};

Validator.isConfirmed = function (selector, getConfirmValue, message) {
    return {
        selector,
        test(value) {
            return value === getConfirmValue()
                ? undefined
                : message || "Giá trị nhập vào không chính xác";
        },
    };
};
