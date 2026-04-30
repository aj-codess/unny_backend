import snow from "./src/utility/id_entry.js";

const execute = () => {

    const id = snow.genStringified_id();
    const id_details = snow.parse_id(id);

    console.log(`
    stringified id - ${id}
    id initials - ${id_details}
    `);
}


export default {
    execute
}