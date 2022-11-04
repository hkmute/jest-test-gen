<% parsedSource.exportComponents.forEach(function(value) { %>describe<% if(!!value.propsMatrix) { %>.each(withMatrix(<%=JSON.stringify(value.propsMatrix) %>))<%} %>('<%=value.name %>', 
  (<% if(!!value.propsMatrix) { %>{<%=Object.keys(value.propsMatrix).toString() %>}<%} %>) => {<% if(value.props.filter(function(prop) {return !prop.isOptional})){ %>
    it('should render component', () => {
      expect(render(<<%=value.name %> <% value.props.filter(function(prop) {return !prop.isOptional}).forEach(function(propType) { %> 
        <%=propType.name %>={<% if (value.propsMatrix[propType.name]) { %><%=propType.name %><%}else { %>/* <%=propType.type %> */<%} %>} <%}) %>
      />));
    });<%} %>
    <% if(value.props.length){ %>it('should render component with props', () => {
      expect(render(<<%=value.name %> <% value.props.forEach(function(propType) { %> 
        <%=propType.name %>={<% if (value.propsMatrix[propType.name]) { %><%=propType.name %><%}else { %>/* <%=propType.type %> */<%} %>} <%}) %>
      />));
  });<%} %>
});
<% })%>
