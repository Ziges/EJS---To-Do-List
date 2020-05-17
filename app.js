//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-dimitri:Test-123@cluster0-hgjme.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const itemsSchema = {
  //schema is the blueprint/ structure of our data, to save in our mongodb todolistDB.
  name: String
};

const Item = mongoose.model("Item", itemsSchema);
//first parameter is the (singular) version of our collection (items). Then we specify the schema.
//by doing this, we create a new collection of items, that must comply with the above schema structure.
const groceries = new Item({
  name: "groceries"
});

const haircut = new Item({
  name: "Haircut"
});

const doctor = new Item({
  name: "doctor"
});

const defaultItems = [groceries, haircut, doctor];

const listSchema = {
  //this is our mongoose Schema
  name: String,
  items: [itemsSchema]
  //an array of itemSchema based items. i.e. for every new list we create, it has a name &
  //has an array of item documents associated with it as well.
}

const List = mongoose.model("List", listSchema);
//this is our mongoose model.



app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
//this method means: we look for objects in the Item collections, when we find them we execute the function.
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully added items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

if (listName==="Today"){
  item.save();
  res.redirect("/");
}else {
  List.findOne({name:listName}, function(err, foundList){
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
  });
}


});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){

      Item.findByIdAndRemove(checkedItemId, function(err) {
        //here we tap into the Items collections using the Item model.
        if (!err) {
          console.log("Successfully deleted item !");
          res.redirect("/");
        }
      });
  } else {
List.findOneAndUpdate({name: listName}, {$pull:{items: {_id: checkedItemId}}}, function (err, foundList){
  if (!err){
    res.redirect("/" + listName);
  }
})
  }

});


app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //if there were no list that was found with same name as typed in the url, then create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        })

        list.save();
        res.redirect("/" + customListName);
        //here we redirect and concactenate the customListName.

      } else {
        //show an existing list.
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items
          //min 12:44, v.368 - confusing
        });
      }
    }
  });


});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
