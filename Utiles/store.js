const Store = require("../model/Store");

const trademantriStore = async()  => {
        return await Store.findOne({
            name: process.env.ROOT_STORE_NAME
        });
}

const ensureStoreId = async (storeId) => {
    if(!storeId){
        let trademantriStore = await trademantriStore()

        storeId = trademantriStore.id;
    }
    return storeId;
}

module.exports = {
    trademantriStore,
    ensureStoreId
}
