import { run } from "@softwaretechnik/dbml-renderer";

type Table = {
    name: string;
    columns: Array<{
        name: string;
        type: string;
        constraints: string[];
    }>;
};

function parseTableDefinition(definition: string): string {
    // Use the run function to render the DBML definition
    const result = run(definition, "svg"); // Replace "svg" with the correct format if needed
    return result; // Return the rendered result as a string
}

// Export the function
export { parseTableDefinition };

// Example Usage
const dbmlString = `
Table users {
    id integer
    username varchar
    role varchar
    created_at timestamp
}

Table posts {
    id integer [primary key]
    title varchar
    body text [note: 'Content of the post']
    user_id integer
    created_at timestamp
}

Ref: posts.user_id > users.id // many-to-one
`;

try {
    const renderedOutput = parseTableDefinition(dbmlString);
    console.log(renderedOutput);
} catch (error: unknown) {
    console.error("Error parsing DBML:", error);
}