import { Connection, PublicKey } from "@solana/web3.js";



const connection = new Connection(HTTP_URL, {
  wsEndpoint: WSS_URL,
});

async function startConnection(
  connection: Connection,
  programAddress: PublicKey,
  searchInstruction: string
): Promise<void> {
  console.log("Monitoring logs for program:", programAddress.toString());
  connection.onLogs(
    programAddress,
    ({ logs, err, signature }) => {
      if (err) return;

      if (logs && logs.some((log) => log.includes(searchInstruction))) {
        console.log(
          "Signature for 'initialize2':",
          `https://explorer.solana.com/tx/${signature}`
        );
        fetchRaydiumMints(signature, connection);
      }
    },
    "finalized"
  );
}

async function fetchRaydiumMints(txId: string, connection: Connection) {
  try {
    const tx = await connection.getParsedTransaction(txId, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });

    const instruction = tx?.transaction.message.instructions.find(
      (ix) => ix.programId.toString() === RAYDIUM_PUBLIC_KEY
    );
    // console.log("Tobias v18", instruction);

    if (instruction && "accounts" in instruction) {
      const accounts = instruction.accounts as PublicKey[];

      const pairAddress = 4;
      const mintAddress = 8;
      const solAddress = 9;

      if (accounts.length > solAddress && accounts.length > mintAddress) {
        const sol = accounts[solAddress];
        const mint = accounts[mintAddress];
        const pair = accounts[pairAddress];

        const displayData = [
          { Token: "A", "Sol Address": sol.toString() },
          { Token: "B", "Mint Address": mint.toString() },
          { Token: "C", "Pair Address": pair.toString() },
        ];

        console.log("New LP Found");
        console.table(displayData);
      } else {
        console.error("Index out of range");
        throw new Error("Index out of range");
      }
    }
  } catch (error) {
    console.log("Error fetching transaction:", txId);
    console.error(error);
    return;
  }
}

startConnection(connection, RAYDIUM, INSTRUCTION_NAME).catch(console.error);
