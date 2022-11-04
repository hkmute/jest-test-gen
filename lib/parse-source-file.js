"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSourceFile = void 0;
const ts = require("typescript");
const debug_1 = require("debug");
const debug = (0, debug_1.default)('jest-test-gen/parse-source-file');
const isNodeJSX = (node) => [
    ts.SyntaxKind.JsxElement,
    ts.SyntaxKind.JsxFragment,
    ts.SyntaxKind.JsxExpression,
    ts.SyntaxKind.JsxSelfClosingElement
].includes(node.kind);
function parseSourceFile(file) {
    const result = {
        imports: [],
        exportFunctions: [],
        exportPojos: [],
        exportClass: undefined,
        exportComponents: [],
        components: [],
        classes: [],
        functions: [],
        pojos: [],
        typeDefinitions: [],
        interfaceDefinitions: [],
        propTypesPojo: [],
    };
    walker(file);
    result.exportComponents = result.exportComponents.map(exportComponent => {
        var _a;
        return Object.assign(Object.assign({}, exportComponent), { props: (_a = exportComponent.props) === null || _a === void 0 ? void 0 : _a.map(prop => (Object.assign(Object.assign({}, prop), { value: getSamplePropValue(prop) }))), propsMatrix: getSampleMatrix(exportComponent.props) });
    });
    return result;
    function walker(node) {
        switch (node.kind) {
            case ts.SyntaxKind.ImportDeclaration:
                debug('walker found import declaration');
                importsWalker(node);
                break;
            case ts.SyntaxKind.ClassDeclaration:
                debug('walker found class declaration');
                classWalker(node);
                break;
            case ts.SyntaxKind.FunctionDeclaration:
                debug('walker found function declaration');
                functionDeclarationWalker(node);
                break;
            case ts.SyntaxKind.VariableStatement:
                debug('walker found variable statement');
                variableStatementWalker(node);
                break;
            case ts.SyntaxKind.ExportDeclaration:
                debug('walker found export declaration');
                exportDeclarationWalker(node);
                break;
            case ts.SyntaxKind.ExportAssignment:
                debug('walker found export assignment');
                exportAssignementWalker(node);
                break;
            case ts.SyntaxKind.ExpressionStatement:
                debug('walker found expression statement');
                expressionStatementWalker(node);
                break;
            case ts.SyntaxKind.TypeAliasDeclaration:
                debug('walker found Type Alias Declaration statement');
                typeDeclarationWalker(node);
                break;
            case ts.SyntaxKind.InterfaceDeclaration:
                interfaceDeclarationWalker(node);
                break;
            default:
                ts.forEachChild(node, walker);
        }
    }
    function hasAsyncModifier(node) {
        return node.modifiers ? node.modifiers.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword) : false;
    }
    function hasStaticModifier(node) {
        return node.modifiers ? node.modifiers.some(mod => mod.kind === ts.SyntaxKind.StaticKeyword) : false;
    }
    function hasExportModifier(node) {
        return node.modifiers ? node.modifiers.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword) : false;
    }
    function hasDefaultModifier(node) {
        return node.modifiers ? node.modifiers.some(mode => mode.kind === ts.SyntaxKind.DefaultKeyword) : false;
    }
    function getReactInheritance(node) {
        let hasReactTypeExpression = (type) => {
            const outerExpression = type.expression;
            const outerExpressionText = outerExpression.getText();
            return ['PureComponent', 'Component', 'React.PureComponent', 'React.Component'].includes(outerExpressionText);
        };
        if (!node.heritageClauses) {
            return;
        }
        return node.heritageClauses.find(clause => clause.types.some(hasReactTypeExpression));
    }
    function hasReactInheritance(node) {
        return !!getReactInheritance(node);
    }
    function hasJSXChildElement(node) {
        let hasJSX = false;
        ts.forEachChild(node, function visitor(child) {
            if (isNodeJSX(child)) {
                hasJSX = true;
            }
            if (child.getChildren()) {
                ts.forEachChild(child, visitor);
            }
        });
        return hasJSX;
    }
    function startsWithCapitalOrNoName(name) {
        if (!name)
            return true;
        return !!name.match(/^[A-Z]{1}/);
    }
    function parseArgumentTypeIntoComponentPropsMap(fnParamNode) {
        let compProps = [];
        if (fnParamNode) {
            const firstArgType = fnParamNode.type;
            if (firstArgType) {
                const tsPropTypeName = firstArgType.typeName.getText();
                const maybeTypeDef = findMatchigTypeByName(tsPropTypeName);
                if (maybeTypeDef) {
                    compProps = parseReactPropsFromTypeDefinition(maybeTypeDef);
                }
            }
        }
        return compProps;
    }
    function parseVariableGenericTypeIntoComponentPropsMap(varChild) {
        var _a;
        let compProps = [];
        if (varChild.type && varChild.type.kind == ts.SyntaxKind.TypeReference) {
            const typeNode = varChild.type;
            if (['FunctionComponent', 'React.FunctionComponent', 'FC', 'React.FC'].includes(typeNode.typeName.getText())) {
                const tsPropType = (_a = typeNode.typeArguments) === null || _a === void 0 ? void 0 : _a[0];
                if (tsPropType) {
                    const tsPropTypeName = tsPropType.typeName.getText();
                    const maybeMatchingTypeDef = findMatchigTypeByName(tsPropTypeName);
                    if (maybeMatchingTypeDef) {
                        compProps = parseReactPropsFromTypeDefinition(maybeMatchingTypeDef);
                    }
                }
            }
        }
        return compProps;
    }
    function classWalker(node) {
        var _a, _b;
        const klass = {
            name: node.name && node.name.escapedText,
            methods: [],
            isDefaultExport: hasDefaultModifier(node),
        };
        if (startsWithCapitalOrNoName(klass.name) && hasReactInheritance(node)) {
            const currComp = {
                name: klass.name,
                isFunctional: false,
                isDefaultExport: hasDefaultModifier(node),
                props: [],
            };
            //parse type argument to the generic Component interface to extract propTypes
            const inheritanceClause = getReactInheritance(node);
            const inheritanceFirstType = inheritanceClause === null || inheritanceClause === void 0 ? void 0 : inheritanceClause.types[0];
            if (inheritanceFirstType && ((_a = inheritanceFirstType === null || inheritanceFirstType === void 0 ? void 0 : inheritanceFirstType.typeArguments) === null || _a === void 0 ? void 0 : _a.length)) {
                const tsPropType = (_b = inheritanceFirstType.typeArguments) === null || _b === void 0 ? void 0 : _b[0];
                if (tsPropType) {
                    currComp.tsPropTypeName = tsPropType.typeName.getText();
                    const maybeMatchingTypeDef = findMatchigTypeByName(currComp.tsPropTypeName);
                    if (maybeMatchingTypeDef) {
                        currComp.props = parseReactPropsFromTypeDefinition(maybeMatchingTypeDef);
                    }
                }
            }
            hasExportModifier(node) ? result.exportComponents.push(currComp) : result.components.push(currComp);
            return;
        }
        ts.forEachChild(node, (child) => {
            if (child.kind === ts.SyntaxKind.MethodDeclaration) {
                const methodChild = child;
                const methodName = methodChild.name ? methodChild.name.escapedText : '';
                klass.methods.push({
                    methodName,
                    params: methodChild.parameters.map(param => param.name.escapedText),
                    isAsync: hasAsyncModifier(methodChild),
                    isStatic: hasStaticModifier(methodChild),
                });
            }
        });
        result.classes.push(klass);
        if (hasExportModifier(node)) {
            result.exportClass = klass;
        }
    }
    function importsWalker(node) {
        const names = [];
        let importText = '';
        if (node.importClause) {
            importText = node.getText();
            ts.forEachChild(node.importClause, (child) => {
                ts.forEachChild(child, (element) => {
                    names.push(element.getText());
                });
            });
        }
        result.imports.push({
            path: node.moduleSpecifier.getText(),
            names,
            importText,
        });
    }
    function functionDeclarationWalker(node) {
        const parsedFunction = {
            name: node.name ? node.name.escapedText : '',
            params: node.parameters.map(param => param.name.escapedText),
            isAsync: hasAsyncModifier(node),
            isDefaultExport: hasDefaultModifier(node)
        };
        debug('function: ', parsedFunction.name, 'isJsx', hasJSXChildElement(node));
        if (startsWithCapitalOrNoName(parsedFunction.name) && hasJSXChildElement(node)) {
            const currComp = {
                name: parsedFunction.name,
                isFunctional: true,
                isDefaultExport: parsedFunction.isDefaultExport,
                props: [],
            };
            hasExportModifier(node) ? result.exportComponents.push(currComp) : result.components.push(currComp);
            const firstArg = node.parameters[0];
            currComp.props = parseArgumentTypeIntoComponentPropsMap(firstArg);
            return;
        }
        if (hasExportModifier(node)) {
            result.exportFunctions.push(parsedFunction);
        }
        else {
            result.functions.push(parsedFunction);
        }
    }
    function variableStatementWalker(node) {
        // check only exported variable statements.
        if (node.declarationList) {
            node.declarationList.forEachChild((child) => {
                //handle arrow function declaration
                const varChild = child;
                if (varChild.initializer && varChild.initializer.kind === ts.SyntaxKind.ArrowFunction) {
                    const parsedFunction = {
                        name: varChild.name.escapedText,
                        params: varChild.initializer.parameters.map(param => param.name.escapedText),
                        isAsync: hasAsyncModifier(varChild.initializer),
                        isDefaultExport: hasDefaultModifier(varChild.initializer),
                    };
                    if (startsWithCapitalOrNoName(parsedFunction.name) && hasJSXChildElement(node)) {
                        const currComp = {
                            name: parsedFunction.name,
                            isFunctional: true,
                            isDefaultExport: parsedFunction.isDefaultExport,
                            props: [],
                        };
                        const firstArg = varChild.initializer.parameters[0];
                        currComp.props = parseArgumentTypeIntoComponentPropsMap(firstArg);
                        // handle component propTypes definition using FunctionComponent generic type, parse it from first typeArgument
                        if (!currComp.props.length) {
                            currComp.props = parseVariableGenericTypeIntoComponentPropsMap(varChild);
                        }
                        hasExportModifier(node) ? result.exportComponents.push(currComp) : result.components.push(currComp);
                        return;
                    }
                    if (hasExportModifier(node)) {
                        result.exportFunctions.push(parsedFunction);
                    }
                    else {
                        result.functions.push(parsedFunction);
                    }
                }
                //handle exported pojo with callable methods
                if (varChild.initializer && varChild.initializer.kind === ts.SyntaxKind.ObjectLiteralExpression) {
                    const parsedPojo = {
                        name: varChild.name && varChild.name.escapedText,
                        isDefaultExport: hasDefaultModifier(varChild.initializer),
                        methods: [],
                    };
                    const parsedPropTypePojo = {
                        name: parsedPojo.name,
                        props: []
                    };
                    let isPropTypePojo = false;
                    const currLiteralExp = varChild.initializer;
                    currLiteralExp.properties.forEach((propNode) => {
                        if (propNode.kind === ts.SyntaxKind.MethodDeclaration) {
                            const methodNode = propNode;
                            const methodName = methodNode.name ? methodNode.name.escapedText : '';
                            parsedPojo.methods.push({
                                methodName,
                                params: methodNode.parameters.map(param => param.name.escapedText),
                                isAsync: hasAsyncModifier(methodNode),
                                isStatic: false,
                            });
                        }
                        if (propNode.kind === ts.SyntaxKind.PropertyAssignment &&
                            propNode.initializer.getText().trim().startsWith('PropTypes')) {
                            isPropTypePojo = true;
                        }
                    });
                    if (isPropTypePojo) {
                        parsedPropTypePojo.props = parseReactPropTypesFromLiteral(currLiteralExp);
                        result.propTypesPojo.push(parsedPropTypePojo);
                        return;
                    }
                    if (hasExportModifier(node)) {
                        result.exportPojos.push(parsedPojo);
                    }
                    else {
                        result.pojos.push(parsedPojo);
                    }
                }
                if (varChild.initializer && varChild.initializer.kind === ts.SyntaxKind.ClassExpression) {
                    const klassExp = {
                        name: varChild.name && varChild.name.escapedText,
                        methods: [],
                        isDefaultExport: false,
                    };
                    ts.forEachChild(varChild.initializer, (child) => {
                        const methodChild = child;
                        if (child.kind === ts.SyntaxKind.MethodDeclaration) {
                            const methodName = methodChild.name ? methodChild.name.escapedText : '';
                            klassExp.methods.push({
                                methodName,
                                params: child.parameters.map(param => param.name.escapedText),
                                isAsync: hasAsyncModifier(child),
                                isStatic: hasStaticModifier(child),
                            });
                        }
                    });
                    result.classes.push(klassExp);
                    result.exportClass = klassExp;
                }
            });
        }
    }
    function exportDeclarationWalker(node) {
        var _a;
        debug('exportDeclarationWalker', (_a = node.exportClause) === null || _a === void 0 ? void 0 : _a.getFullText());
        node.exportClause && node.exportClause.elements.forEach(identifier => {
            const idName = identifier.name.escapedText;
            debug('exportDeclarationWalker', idName);
            const foundClassByIdentifier = result.classes.find(klass => klass.name === idName);
            if (foundClassByIdentifier) {
                result.exportClass = foundClassByIdentifier;
            }
            const foundFunctionByIdentifier = result.functions.find(func => func.name === idName);
            if (foundFunctionByIdentifier) {
                result.exportFunctions.push(foundFunctionByIdentifier);
            }
            const foundPojoByIdentifier = result.pojos.find(pojo => pojo.name === idName);
            if (foundPojoByIdentifier) {
                result.exportPojos.push(foundPojoByIdentifier);
            }
            const foundComponentByIdentifier = result.components.find(component => component.name === idName);
            if (foundComponentByIdentifier) {
                result.exportComponents.push(foundComponentByIdentifier);
            }
        });
    }
    function exportAssignementWalker(node) {
        let idName = node.expression.escapedText;
        if (node.expression.kind === ts.SyntaxKind.CallExpression &&
            (node.expression.getFullText().trim().startsWith('React.memo') || node.expression.getFullText().trim().startsWith('connect'))) {
            const callExpr = node.expression;
            if (callExpr.arguments.length && callExpr.arguments[0].kind === ts.SyntaxKind.Identifier) {
                idName = callExpr.arguments[0].getFullText();
            }
        }
        const foundClassByIdentifier = result.classes.find(klass => klass.name === idName);
        if (foundClassByIdentifier) {
            result.exportClass = Object.assign(Object.assign({}, foundClassByIdentifier), { isDefaultExport: true });
        }
        const foundFunctionByIdentifier = result.functions.find(func => func.name === idName);
        if (foundFunctionByIdentifier) {
            result.exportFunctions.push(Object.assign(Object.assign({}, foundFunctionByIdentifier), { isDefaultExport: true }));
        }
        const foundPojoByIdentifier = result.pojos.find(pojo => pojo.name === idName);
        if (foundPojoByIdentifier) {
            result.exportPojos.push(Object.assign(Object.assign({}, foundPojoByIdentifier), { isDefaultExport: true }));
        }
        const foundComponentByIdentifier = result.components.find(component => component.name === idName);
        if (foundComponentByIdentifier) {
            result.exportComponents.push(Object.assign(Object.assign({}, foundComponentByIdentifier), { isDefaultExport: true }));
        }
    }
    function expressionStatementWalker(node) {
        var _a, _b;
        //look for binary expressions 
        if (((_a = node.expression) === null || _a === void 0 ? void 0 : _a.kind) === ts.SyntaxKind.BinaryExpression) {
            const binaryExpression = node.expression;
            const leftExp = binaryExpression.left;
            const rightExp = binaryExpression.right;
            const findMatchingComponent = (idName) => {
                return result.exportComponents.find(component => component.name === idName) ||
                    result.components.find(component => component.name === idName);
            };
            if (leftExp.name.escapedText === 'propTypes') {
                const expText = (_b = leftExp.expression) === null || _b === void 0 ? void 0 : _b.escapedText;
                const currComponent = findMatchingComponent(expText);
                if (currComponent) {
                    currComponent.props = parseReactPropTypesFromLiteral(rightExp);
                }
            }
        }
    }
    function interfaceDeclarationWalker(node) {
        result.interfaceDefinitions.push(node);
    }
    function typeDeclarationWalker(node) {
        result.typeDefinitions.push(node);
    }
    function findMatchigTypeByName(tsTypeName) {
        return result.typeDefinitions.find(node => node.name.escapedText === tsTypeName) || result.interfaceDefinitions.find(node => node.name.escapedText === tsTypeName);
    }
    function parseReactPropsFromTypeDefinition(node) {
        var _a, _b;
        if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
            return node.members.map(prop => {
                var _a;
                const propDesc = prop;
                return {
                    name: propDesc.name.escapedText,
                    type: ((_a = propDesc.type) === null || _a === void 0 ? void 0 : _a.getFullText().trim()) || '',
                    isOptional: !!propDesc.questionToken
                };
            });
        }
        if (node.kind === ts.SyntaxKind.TypeAliasDeclaration) {
            if (node.type.kind === ts.SyntaxKind.TypeLiteral) {
                return node.type.members.map(prop => {
                    var _a;
                    const propDesc = prop;
                    return {
                        name: propDesc.name.escapedText,
                        type: ((_a = propDesc.type) === null || _a === void 0 ? void 0 : _a.getFullText().trim()) || '',
                        isOptional: !!propDesc.questionToken
                    };
                });
            }
            if (node.type.kind === ts.SyntaxKind.TypeReference) {
                const refNode = node.type;
                if (refNode.typeName.getFullText().trim() === 'PropTypes.InferProps') {
                    const propTypePojoName = ((_a = refNode.typeArguments) === null || _a === void 0 ? void 0 : _a[0]).exprName.getText();
                    if (propTypePojoName) {
                        return ((_b = result.propTypesPojo.find(pojo => pojo.name === propTypePojoName)) === null || _b === void 0 ? void 0 : _b.props) || [];
                    }
                }
            }
        }
        return [];
    }
    function parseReactPropTypesFromLiteral(literalObj) {
        return literalObj.properties.filter(prop => prop.name).map((prop) => {
            var _a;
            const fullPropText = prop.initializer.getFullText().trim();
            return {
                name: (_a = prop.name) === null || _a === void 0 ? void 0 : _a.escapedText,
                type: fullPropText,
                isOptional: fullPropText.indexOf('isRequired') === -1
            };
        });
    }
    function getSamplePropValue(propType) {
        switch (propType.type) {
            case "string":
                return "\"test string\"";
            case "number":
                return "{123}";
            case "boolean":
                return "{false}";
            default: {
                return `{/* ${propType.type} */}`;
            }
        }
    }
    function getSampleMatrix(props) {
        if (!(props === null || props === void 0 ? void 0 : props.length))
            return;
        const propsMatrix = props.reduce((matrix, prop) => {
            if (!prop.name) {
                return matrix;
            }
            switch (prop.type) {
                case "string":
                    matrix[prop.name] = ["test string"];
                    break;
                case "number":
                    matrix[prop.name] = [123];
                    break;
                case "boolean":
                    matrix[prop.name] = [true, false];
                    break;
                default:
            }
            return matrix;
        }, {});
        return propsMatrix;
    }
}
exports.parseSourceFile = parseSourceFile;
