<% if(parsedSource.exportComponents.length) {%>import React from 'react';
<% if(!!parsedSource.exportComponents.find(component => !!component.propsMatrix)) {%>import withMatrix from '@toby-util/helper/helper/withMatrix';
<% } %>import { render } from '@toby-util/redux-utils/test-utils/react-testing-library';
<% } %><% allImports.forEach(function(value) { %><%=value.importText %>
<% }) %>import <%if(defaultExport)
{ %><%=defaultExport.name %><% }%><%=(defaultExport && namedExportsList.length ? ', ' : '') %><%if(namedExportsList.length) {%>{ <%=namedExportsList %> }<%} %> from <%=quoteSymbol %><%=path %><%=quoteSymbol %>;
