export const SCOPE_NAME_MIN_LENGTH          = 2
export const SCOPE_NAME_MAX_LENGTH          = 30
export const DECISION_NAME_MIN_LENGTH       = 2
export const DECISION_NAME_MAX_LENGTH       = 40
export const FILTER_NUMBER_VALUES_REGEX     = /^-?[0-9]*\.?([0-9]*)?$/
export const FILTER_DATE_INPUT_VALUES_REGEX = /^(\d{1,3}(?!\/)|\d{4})(\/(|[0-9]|0[1-9]|1[0-2])(\/(|[0-9]|0[1-9]|[1-3][0-9]))?)?$/
export const FILTER_DUAL_FIELDS_TYPES       = [
                                                'number',
                                                'date',
                                                'timeline',
                                              ]