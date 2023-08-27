import jsonServerProvider from "ra-data-json-server";  
import { Admin, ListGuesser, Resource } from "react-admin";

const dataProvider = jsonServerProvider("https://jsonplaceholder.typicode.com");


// Tab？
//https://marmelab.com/react-admin/TabbedForm.html

const App = () => (



  <Admin dataProvider={dataProvider}>aa
    <Resource name="posts" list={ListGuesser} />
    <Resource name="comments" list={ListGuesser} />
  </Admin>



);

export default App;
