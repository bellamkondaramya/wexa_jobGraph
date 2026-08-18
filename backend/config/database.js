import neo4j from "neo4j-driver";

const required = ["COGNODB_URI", "COGNODB_USERNAME", "COGNODB_PASSWORD"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} is not configured`);
  }
}

export const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(process.env.COGNODB_USERNAME, process.env.COGNODB_PASSWORD),
 
);

export async function verifyDatabase() {
  const session = driver.session();
  try {
    await session.run("RETURN 1 AS ok");
    return true;
  } finally {
    await session.close();
  }
}

export async function closeDatabase() {
  await driver.close();
}
