const {
    parse,
    validate,
    execute,
    specifiedRules
} = require('graphql');

module.exports = (schema, source, customValidators = [], customExecutor = null) => {
    const documentAST = parse(source);
    const errors = validate(
        schema,
        documentAST,
        specifiedRules.concat(customValidators)
    );

    if (errors.length) {
        throw new Error(errors.map(err => err.message));
    }

    const executor = (rootValue = {}, variableValues = {}, contextValue = {}, operationName = null) => {
        try {
            const executorArgs = [
                schema,
                documentAST,
                rootValue,
                contextValue,
                variableValues,
                operationName
            ];

            let executor = customExecutor ? customExecutor.apply(null, executorArgs) : execute.apply(null, executorArgs);

            if(!executor.then) {
                executor = Promise.resolve(executor);
            }

            return executor.then(response => {
                if (response && response.errors) {
                    throw new Error(response.errors.map(err => err.message));
                }

                return response;
            });
        } catch (err) {
            return Promise.reject(err);
        }
    };

    executor.documentAST = documentAST;

    return executor;
};