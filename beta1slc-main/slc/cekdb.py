from pymongo import MongoClient

connection_string ="mongodb+srv://myAtlasDBUser:Vincent2002@myatlasclusteredu.jzsh9rx.mongodb.net/slc_capstone?retryWrites=true&w=majority&appName=myAtlasClusterEDU" #"mongodb+srv://myAtlasDBUser:Vincent2002@cluster0.mongodb.net/slc_capstone?retryWrites=true&w=majority"

client = MongoClient(connection_string)
print("Connected to MongoDB!")

db = client['slc_capstone']