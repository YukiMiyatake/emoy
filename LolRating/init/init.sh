aws dynamodb create-table --cli-input-json file://../init/create_table.json --endpoint-url http://localhost:8000

aws dynamodb batch-write-item --request-items file://../init/input_data.json --endpoint-url http://localhost:8000
