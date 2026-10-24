module Main (main) where

import Control.Exception (evaluate)
import MetaHistory
import Test.Hspec
import Prelude hiding (id)

main :: IO ()
main = hspec $ do
  describe "resolveMetaHistory " $ do
    it "should resolve to a linear history without any meta operations" $ do
      resolveMetaHistory
        [ MHOperation {id = "abc1", metaLevel = 0, name = "Draw Line", opData = Line {color = "blue"}},
          MHOperation {id = "abc2", metaLevel = 1, name = "Edit Draw Line", opData = Recolor {target = "abc1", color = "green"}},
          MHOperation {id = "abc3", metaLevel = 2, name = "Undo Edit Draw Line", opData = Undo {target = "abc2"}},
          MHOperation {id = "abc4", metaLevel = 3, name = "Undo Undo Edit Draw Line", opData = Undo {target = "abc3"}}, -- AKA Redo
          MHOperation {id = "abc5", metaLevel = 0, name = "Draw Circle", opData = Circle {color = "pink"}},
          MHOperation {id = "abc6", metaLevel = 0, name = "Draw Triangle", opData = Triangle {color = "red"}},
          MHOperation {id = "abc7", metaLevel = 1, name = "Undo Draw Triangle", opData = Undo {target = "abc6"}}
        ]
        `shouldBe` [ MHOperation {id = "abc1", metaLevel = 0, name = "Draw Line", opData = Line {color = "green"}},
                     MHOperation {id = "abc5", metaLevel = 0, name = "Draw Circle", opData = Circle {color = "pink"}}
                   ]
    it "should handle 'insert' meta-operations" $ do
      resolveMetaHistory
        [ MHOperation {id = "c", metaLevel = 0, name = "Draw Circle", opData = Circle {color = "pink"}},
          MHOperation {id = "t", metaLevel = 0, name = "Draw Triangle", opData = Triangle {color = "red"}},
          MHOperation {id = "i", metaLevel = 1, name = "Insert Draw Line", opData = Insert {insertIndex = 1, insertOp = MHOperation {id = "l", metaLevel = 0, name = "Draw Line", opData = Line {color = "blue"}}}}
        ]
        `shouldBe` [ MHOperation {id = "c", metaLevel = 0, name = "Draw Circle", opData = Circle {color = "pink"}},
                     MHOperation {id = "l", metaLevel = 0, name = "Draw Line", opData = Line {color = "blue"}},
                     MHOperation {id = "t", metaLevel = 0, name = "Draw Triangle", opData = Triangle {color = "red"}}
                   ]
    it "should throw error if meta operation targets itself" $ do
      evaluate
        ( resolveMetaHistory
            [ MHOperation {id = "so-meta", metaLevel = 1, name = "Undo Self!?", opData = Undo {target = "so-meta"}}
            ]
        )
        `shouldThrow` errorCall "target operation 'so-meta' has equal meta level to the meta operation. Meta operations must only target operations less meta than themselves."
    it "should throw error if target operation has higher meta level to meta operation" $ do
      evaluate
        ( resolveMetaHistory
            [ MHOperation {id = "abc1", metaLevel = 0, name = "Draw Line", opData = Line {color = "blue"}},
              MHOperation {id = "abc2", metaLevel = 1, name = "Undo Undo Undo Edit Draw Line", opData = Undo {target = "abc4"}}, -- incorrect metaLevel
              MHOperation {id = "abc3", metaLevel = 1, name = "Undo Edit Draw Line", opData = Undo {target = "abc2"}},
              MHOperation {id = "abc4", metaLevel = 2, name = "Undo Undo Edit Draw Line", opData = Undo {target = "abc3"}} -- AKA Redo
            ]
        )
        `shouldThrow` errorCall "target operation 'abc4' was already applied and thus can't be affected."
    it "should throw error if target operation has equal meta level to meta operation" $ do
      evaluate
        ( resolveMetaHistory
            [ MHOperation {id = "abc1", metaLevel = 0, name = "Draw Line", opData = Line {color = "blue"}},
              MHOperation {id = "abc2", metaLevel = 1, name = "Undo Edit Draw Line", opData = Undo {target = "abc1"}},
              MHOperation {id = "abc3", metaLevel = 2, name = "Undo Undo Edit Draw Line", opData = Undo {target = "abc2"}}, -- AKA Redo
              MHOperation {id = "abc4", metaLevel = 2, name = "Undo Undo Undo Edit Draw Line?", opData = Undo {target = "abc3"}} -- incorrect metaLevel
            ]
        )
        `shouldThrow` errorCall "target operation 'abc3' was already applied and thus can't be affected."
    it "should throw error if target operation has equal meta level to meta operation, with target after meta" $ do
      evaluate
        ( resolveMetaHistory
            [ MHOperation {id = "abc1", metaLevel = 0, name = "Draw Line", opData = Line {color = "blue"}},
              MHOperation {id = "abc2", metaLevel = 1, name = "Undo Edit Draw Line", opData = Undo {target = "abc1"}},
              MHOperation {id = "abc4", metaLevel = 2, name = "Undo Undo Undo Edit Draw Line?", opData = Undo {target = "abc3"}}, -- incorrect metaLevel
              MHOperation {id = "abc3", metaLevel = 2, name = "Undo Undo Edit Draw Line", opData = Undo {target = "abc2"}} -- AKA Redo
            ]
        )
        `shouldThrow` errorCall "target operation 'abc3' has equal meta level to the meta operation. Meta operations must only target operations less meta than themselves."
    it "should throw error if target operation not found" $ do
      evaluate
        ( resolveMetaHistory
            [ MHOperation {id = "abc1", metaLevel = 0, name = "Draw Line", opData = Line {color = "blue"}},
              MHOperation {id = "abc3", metaLevel = 2, name = "Undo Edit Draw Line", opData = Undo {target = "abc2"}}
            ]
        )
        `shouldThrow` errorCall "target operation 'abc2' not found."
    it "should throw error if target operation was already removed by another meta-operation" $ do
      evaluate
        ( resolveMetaHistory
            [ MHOperation {id = "abc1", metaLevel = 0, name = "Draw Line", opData = Line {color = "blue"}},
              MHOperation {id = "abc2", metaLevel = 1, name = "Undo Draw Line", opData = Undo {target = "abc1"}},
              MHOperation {id = "abc3", metaLevel = 2, name = "Undo Draw Line Again", opData = Undo {target = "abc1"}}
            ]
        )
        `shouldThrow` errorCall "target operation 'abc1' was already removed by operation 'abc3'."
