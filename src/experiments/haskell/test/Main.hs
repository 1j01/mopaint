module Main (main) where

import MetaHistory
import Test.Hspec
import Control.Exception (evaluate)

main :: IO ()
main = hspec $ do
  describe "resolveMetaHistory " $ do
    it "should resolve to a linear history without any meta operations" $ do
      resolveMetaHistory [
        MHOperation { id = "abc1", metaLevel = 0, opType = "line", name = "Draw Line", color = "blue" },
        MHOperation { id = "abc2", metaLevel = 1, opType = "recolor", name = "Edit Draw Line", target = "abc1", color = "green" },
        MHOperation { id = "abc3", metaLevel = 2, opType = "undo", name = "Undo Edit Draw Line", target = "abc2" },
        MHOperation { id = "abc4", metaLevel = 3, opType = "undo", name = "Undo Undo Edit Draw Line", target = "abc3" }, -- AKA Redo
        MHOperation { id = "abc5", metaLevel = 0, opType = "circle", name = "Draw Circle", color = "pink" },
        MHOperation { id = "abc6", metaLevel = 0, opType = "triangle", name = "Draw Triangle", color = "red" },
        MHOperation { id = "abc7", metaLevel = 1, opType = "undo", name = "Undo Draw Triangle", target = "abc6" }
      ] `shouldBe` [
        MHOperation { id = "abc1", metaLevel = 0, opType = "line", name = "Draw Line", color = "green" },
        MHOperation { id = "abc5", metaLevel = 0, opType = "circle", name = "Draw Circle", color = "pink" },
      ]
    it "should handle 'insert' meta-operations" $ do
      resolveMetaHistory [
        MHOperation { id = "c", metaLevel = 0, opType = "circle", name = "Draw Circle", color = "pink" },
        MHOperation { id = "t", metaLevel = 0, opType = "triangle", name = "Draw Triangle", color = "red" },
        MHOperation { id = "i", metaLevel = 1, opType = "insert", name = "Insert Draw Line", insertIndex = 1, insertOp = MHOperation { id = "l", metaLevel = 0, opType = "line", name = "Draw Line", color = "blue" } },
      ] `shouldBe` [
        MHOperation { id = "c", metaLevel = 0, opType = "circle", name = "Draw Circle", color = "pink" },
        MHOperation { id = "l", metaLevel = 0, opType = "line", name = "Draw Line", color = "blue" },
        MHOperation { id = "t", metaLevel = 0, opType = "triangle", name = "Draw Triangle", color = "red" },
      ]
    it "should throw error if meta operation targets itself" $ do
      evaluate (resolveMetaHistory [
        MHOperation { id = "so-meta", metaLevel = 1, opType = "undo", name = "Undo Self!?", target = "so-meta" },
      ]) `shouldThrow` errorCall "target operation 'so-meta' has equal meta level to the meta operation"
    it "should throw error if target operation has higher meta level to meta operation" $ do
      evaluate (resolveMetaHistory [
        MHOperation { id = "abc1", metaLevel = 0, opType = "line", name = "Draw Line", color = "blue" },
        MHOperation { id = "abc2", metaLevel = 1, opType = "undo", name = "Undo Undo Undo Edit Draw Line", target = "abc4" }, -- incorrect metaLevel
        MHOperation { id = "abc3", metaLevel = 1, opType = "undo", name = "Undo Edit Draw Line", target = "abc2" },
        MHOperation { id = "abc4", metaLevel = 2, opType = "undo", name = "Undo Undo Edit Draw Line", target = "abc3" }, -- AKA Redo
      ]) `shouldThrow` errorCall "target operation 'abc4' was already applied and thus can't be affected"
    it "should throw error if target operation has equal meta level to meta operation" $ do
      evaluate (resolveMetaHistory [
        MHOperation { id = "abc1", metaLevel = 0, opType = "line", name = "Draw Line", color = "blue" },
        MHOperation { id = "abc2", metaLevel = 1, opType = "undo", name = "Undo Edit Draw Line", target = "abc1" },
        MHOperation { id = "abc3", metaLevel = 2, opType = "undo", name = "Undo Undo Edit Draw Line", target = "abc2" }, -- AKA Redo
        MHOperation { id = "abc4", metaLevel = 2, opType = "undo", name = "Undo Undo Undo Edit Draw Line?", target = "abc3" }, -- incorrect metaLevel
      ]) `shouldThrow` errorCall "target operation 'abc3' was already applied and thus can't be affected."
    it "should throw error if target operation has equal meta level to meta operation, with target after meta" $ do
      evaluate (resolveMetaHistory [
        MHOperation { id = "abc1", metaLevel = 0, opType = "line", name = "Draw Line", color = "blue" },
        MHOperation { id = "abc2", metaLevel = 1, opType = "undo", name = "Undo Edit Draw Line", target = "abc1" },
        MHOperation { id = "abc4", metaLevel = 2, opType = "undo", name = "Undo Undo Undo Edit Draw Line?", target = "abc3" }, -- incorrect metaLevel
        MHOperation { id = "abc3", metaLevel = 2, opType = "undo", name = "Undo Undo Edit Draw Line", target = "abc2" }, -- AKA Redo
      ]) `shouldThrow` errorCall "target operation 'abc3' has equal meta level to the meta operation"
    it "should throw error if target operation not found" $ do
      evaluate (resolveMetaHistory [
        MHOperation { id = "abc1", metaLevel = 0, opType = "line", name = "Draw Line", color = "blue" },
        MHOperation { id = "abc3", metaLevel = 2, opType = "undo", name = "Undo Edit Draw Line", target = "abc2" },
      ]) `shouldThrow` errorCall "target operation 'abc2' not found"
