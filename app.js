const express = require('express')
const mongoose = require('mongoose')
const capitalize = require('lodash/capitalize')

const app = express()
const port = process.env.PORT || 3000

mongoose.connect('mongodb://localhost:27017/todolistDB')

const itemsSchema = mongoose.Schema({
    name: String,
})

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const Item = new mongoose.model('Item', itemsSchema)
const List = new mongoose.model('List', listSchema)

const item1 = new Item({
    name: 'buy milk'
})
const item2 = new Item({
    name: 'drink milk'
})
const item3 = new Item({
    name: 'sleep'
})

const defaultItems = [item1, item2, item3]

Item.find()
    .then((res) => {
        if (!res.length) Item.insertMany(defaultItems)
    })
    .catch((err) => {
        console.warn(err)
        Item.insertMany(defaultItems)
    })

app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))
app.set('view engine', 'ejs')

app.get('/', async (req, res) => {
    const items = await Item.find()

    res.render('list', {listTitle: 'Today', listItems: items})
})

app.post('/', (req, res) => {
    const itemName = req.body.newItem
    const listName = req.body.list

    const newItem = new Item({
        name: itemName
    })

    if (listName === 'Today') {
        newItem.save().then(() => {
            res.redirect('/')
        })
    } else {
        List.findOne({name: listName})
            .then(async list => {
                list.items.push(newItem)
                await list.save()
                res.redirect(`/${listName}`)
            })
    }

})

app.post('/delete', (req, res) => {
    const checkedItemId = req.body.itemId
    const listName = req.body.list

    if (listName === 'Today') {
        Item.deleteOne({_id: checkedItemId})
            .then(() => res.redirect('/'))
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
            .then(() => res.redirect(`/${listName}`))
    }
})

app.get('/:listName', (req, res) => {
    const listName = capitalize(req.params.listName)

    List.findOne({name: listName})
        .then((list) => {
            if (!list) {
                const list = new List({
                    name: listName,
                    items: defaultItems
                })
                list.save()
                res.redirect(`/${listName}`)
            } else {
                res.render('list', {listTitle: `${listName} list`, listItems: list.items})
            }
        })
})

app.get('/about', (req, res) => {
    res.render('about')
})

app.listen(port, () => console.log(`Server is running on port :${port}`))
